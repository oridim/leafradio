import type { ViewCallback } from '@oridim/datastar-serve';
import { withMiddleware } from '@oridim/datastar-serve';

import { withEntityManager } from '@/shared/database/mod.ts';

import { withRepositories } from '@/ui/hooks/repositories.tsx';
import { withRadios } from '@/ui/hooks/radios.tsx';

import Layout from '@/ui/components/Layout.tsx';

export default withMiddleware<ViewCallback<'/radios/:radioID/edit/buckets'>>(
    [withEntityManager, withRadios, withRepositories],
    () => {
        return (
            <Layout>
                <h1>Hello world!</h1>
            </Layout>
        );
    },
);
