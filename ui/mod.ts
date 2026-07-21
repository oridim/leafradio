import { load as loadRFD } from '@miyauci/rfd/deno';

export default async () => {
    console.log('[LeafRadio] Initializing Rusty File Dialog...');
    await loadRFD();
};
