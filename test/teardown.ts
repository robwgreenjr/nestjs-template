module.exports = async function (globalConfig: any, projectConfig: any) {
    // @ts-ignore
    await globalThis.container.stop();
};
