export type PluginGlobalSettings = {
    plugins: { [k: string]: string[] },
    categoryList: string[],
    pluginList: string[],
    sibeliusToken: string,
}

export type Payload = {
    message: string,
    name?: string,
    commands?: string[],
}

export type SibeliusResponse = {
    sessionToken: string,
    message: string,
    result: boolean,
    returnValue: string,
}

export type StaveValues = [
    string,
    string,
    string,
]
