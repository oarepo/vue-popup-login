export function normalizeUrl(url: string) {
    return (new URL(url, window.location.href)).toString()
}
