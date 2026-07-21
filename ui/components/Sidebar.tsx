import { basename } from '@std/path';

import type { StreamChannelCallback } from '@oridim/datastar-serve';
import {
    Edit2,
    HardDrive,
    Play,
    Plus,
    Radio,
    RefreshCw,
    Trash2,
    Unlink,
} from 'lucide-preact';

import type { PolymorphicProps } from '@/lib/utilities/jsx.ts';
import { cls } from '@/lib/utilities/jsx.ts';
import { humanifyPath } from '@/lib/utilities/path.ts';

import type {
    RadioEntity,
    RepositoryEntity,
    RepositoryScanStates,
} from '@/shared/database/mod.ts';
import {
    ENTITY_MANAGER,
    ENTITY_RADIO,
    ENTITY_REPOSITORY,
    EVENT_RADIOS_MUTATED,
    EVENT_REPOSITORIES_MUTATED,
    REPOSITORY_SCAN_STATES,
    withEntityManager,
} from '@/shared/database/mod.ts';
import { scanRepository as _scanRepository } from '@/shared/pipelines/mod.ts';

import useRadios from '@/ui/hooks/radios.tsx';
import useRepositories from '@/ui/hooks/repositories.tsx';
import type { ModifierColorSchemes } from '@/ui/utilities/styles.ts';
import { MODIFIER_COLOR_SCHEMES } from '@/ui/utilities/styles.ts';

import Badge from '@/ui/components/Badge.tsx';
import Button from '@/ui/components/Button.tsx';
import NavEntry from '@/ui/components/NavEntry.tsx';
import NavSection from '@/ui/components/NavSection.tsx';
import NowPlayingWidget from '@/ui/components/NowPlayingWidget.tsx';

export type SidebarProps = {} & PolymorphicProps<'aside'>;

export const synchronizeSidebar = (({ request }, { push }) => {
    if (request.method !== 'GET') {
        return null;
    }

    const radiosSubscription = EVENT_RADIOS_MUTATED.subscribe(
        withEntityManager(
            async () => {
                const radios = await ENTITY_MANAGER.findAll(
                    ENTITY_RADIO,
                );

                push({
                    patchElements: {
                        elements: (
                            <RadiosNavSection
                                radios={radios}
                            />
                        ),
                    },
                });
            },
        ),
    );

    const repositoriesSubscription = EVENT_REPOSITORIES_MUTATED.subscribe(
        withEntityManager(
            async () => {
                const repositories = await ENTITY_MANAGER.findAll(
                    ENTITY_REPOSITORY,
                );

                push({
                    patchElements: {
                        elements: (
                            <RepositoriesNavSection
                                repositories={repositories}
                            />
                        ),
                    },
                });
            },
        ),
    );

    return () => {
        radiosSubscription[Symbol.dispose]();
        repositoriesSubscription[Symbol.dispose]();
    };
}) satisfies StreamChannelCallback;

function determineRepositoryBadge(
    scanState: RepositoryScanStates,
): [string, ModifierColorSchemes] {
    switch (scanState) {
        case REPOSITORY_SCAN_STATES.badScan:
        case REPOSITORY_SCAN_STATES.interruptedScan:
            return ['ERROR', MODIFIER_COLOR_SCHEMES.faulted];

        case REPOSITORY_SCAN_STATES.processingFiles:
            return ['PROCESSING', MODIFIER_COLOR_SCHEMES.executing];

        case REPOSITORY_SCAN_STATES.scanningDirectory:
            return ['SCANNING', MODIFIER_COLOR_SCHEMES.inspective];

        case REPOSITORY_SCAN_STATES.unscanned:
            return ['UNSCANNED', MODIFIER_COLOR_SCHEMES.queued];
    }

    return ['READY', MODIFIER_COLOR_SCHEMES.constructive];
}

function RadiosNavSection(props: {
    readonly radios: RadioEntity[];
}) {
    const { radios } = props;

    return (
        <NavSection
            id='nav-section-radios'
            action={
                <Button data-on:click='@post("/radios")' isIcon>
                    <Plus />
                </Button>
            }
            icon={Radio}
            text='RADIOS'
        >
            {radios.map(({ name, radioID }) => (
                <NavEntry
                    key={radioID}
                    id={`nav-entry-radio-${radioID}`}
                    actions={
                        <>
                            <Button
                                as='a'
                                href={`/radios/${radioID}/play`}
                                colorScheme={MODIFIER_COLOR_SCHEMES.inspective}
                                variant='subtle'
                                isIcon
                            >
                                <Play />
                            </Button>

                            <Button
                                as='a'
                                href={`/radios/${radioID}/edit/details`}
                                colorScheme={MODIFIER_COLOR_SCHEMES.mutative}
                                variant='subtle'
                                isIcon
                            >
                                <Edit2 />
                            </Button>

                            <Button
                                colorScheme={MODIFIER_COLOR_SCHEMES.destructive}
                                variant='subtle'
                                data-on:click={`@delete("/radios/${radioID}")`}
                                isIcon
                            >
                                <Trash2 />
                            </Button>
                        </>
                    }
                    text={name}
                />
            ))}
        </NavSection>
    );
}

function RepositoriesNavSection(props: {
    readonly repositories: RepositoryEntity[];
}) {
    const { repositories } = props;

    return (
        <NavSection
            id='nav-seciton-repositories'
            action={
                <Button data-on:click='@post("/repositories")' isIcon>
                    <Plus />
                </Button>
            }
            icon={HardDrive}
            text='REPOSITORIES'
        >
            {repositories.toSorted((repositoryA, repositoryB) => {
                const basenameA = basename(repositoryA.directoryPath);
                const basenameB = basename(repositoryB.directoryPath);

                return basenameA > basenameB ? 1 : -1;
            }).map(({ directoryPath, repositoryID, scanState }) => {
                const [badgeText, badgeColorScheme] = determineRepositoryBadge(
                    scanState,
                );

                const isScanningDisabled = ([
                    REPOSITORY_SCAN_STATES.processingFiles,
                    REPOSITORY_SCAN_STATES.scanningDirectory,
                ] as string[]).includes(scanState);

                return (
                    <NavEntry
                        key={repositoryID}
                        id={`nav-entry-repository-${repositoryID}`}
                        actions={
                            <>
                                <Button
                                    disabled={isScanningDisabled}
                                    colorScheme={MODIFIER_COLOR_SCHEMES
                                        .mutative}
                                    variant='subtle'
                                    isIcon
                                    data-on:click={`@post("/repositories/${repositoryID}/scan")`}
                                >
                                    <RefreshCw />
                                </Button>

                                <Button
                                    colorScheme={MODIFIER_COLOR_SCHEMES
                                        .destructive}
                                    variant='subtle'
                                    isIcon
                                    data-on:click={`@delete("/repositories/${repositoryID}")`}
                                >
                                    <Unlink />
                                </Button>
                            </>
                        }
                        badge={
                            <Badge colorScheme={badgeColorScheme}>
                                {badgeText}
                            </Badge>
                        }
                        text={basename(directoryPath)}
                        subText={humanifyPath(directoryPath)}
                    />
                );
            })}
        </NavSection>
    );
}

export default function Sidebar(props: SidebarProps) {
    const { className, ...rest } = props;

    const radios = useRadios();
    const repositories = useRepositories();

    return (
        <aside
            {...rest}
            className={cls('sidebar', className)}
            data-init='@get("/synchronize/sidebar")'
        >
            <div className='sidebar--header'>
                <NowPlayingWidget />
            </div>

            <div className='sidebar--content'>
                <RadiosNavSection radios={radios} />
                <RepositoriesNavSection repositories={repositories} />
            </div>
        </aside>
    );
}
