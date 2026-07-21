import type { ViewCallback } from '@oridim/datastar-serve';
import { withMiddleware } from '@oridim/datastar-serve';
import { StopCircle } from 'lucide-preact';

import { withEntityManager } from '@/shared/database/mod.ts';

import { withRepositories } from '@/ui/hooks/repositories.tsx';
import { withRadios } from '@/ui/hooks/radios.tsx';

import EmptyState from '@/ui/components/EmptyState.tsx';
import Layout from '@/ui/components/Layout.tsx';

export default withMiddleware<ViewCallback<'/'>>(
    [withEntityManager, withRadios, withRepositories],
    () => {
        return (
            <Layout>
                <EmptyState
                    icon={StopCircle}
                    subText='Play a radio from the sidebar to start listening.'
                    text='No Radio Playing'
                />
            </Layout>
        );
    },
);
