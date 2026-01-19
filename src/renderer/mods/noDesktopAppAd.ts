import type { Mod } from '../types';
import { findModule, modMeta } from '../utils';

type Exports = {
    getUserDesktopOs: () => string | null;
};

const mod: Mod = async (modules) => {
    const module = await findModule<Exports>(
        modules,
        (module) =>
            module.id === 'WAWebDesktopUpsellUtils' &&
            typeof module.exports.getUserDesktopOs === 'function'
    );

    if (!module) throw new Error('Module not found');

    module.exports.getUserDesktopOs = () => null;

    return modMeta({
        name: 'No Desktop App Ad',
        description: 'Removes the desktop app advertisement banner.',
        version: '1.0.0'
    });
};

export default mod;
