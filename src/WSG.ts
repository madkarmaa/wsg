// Exposed as `window.WSG`: used by patches (`$self`) and handy for poking around in the console

export * as Api from './api';
export * as Plugins from './api/PluginManager';
export { PlainSettings, Settings } from './api/Settings';
export * as Modules from './modules';
export * as Util from './utils';
