const axios = require("axios")
const { getCachedToken, refreshToken } = require("./anotaaiAuth")

const anotaaiApi = axios.create({
    baseURL: "https://gateway-partners.anota.ai/api-old/partnerauth/v2"
})

let cachedPageId = null

function getPageId() {
    if (!cachedPageId) {
        const payload = process.env.ANOTA_AI_STORE_TOKEN.split(".")[1]
        const { idpage } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
        cachedPageId = idpage
    }
    return cachedPageId
}

anotaaiApi.interceptors.request.use((config) => {
    const token = getCachedToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    config.headers["x-page-id"] = getPageId()
    return config
})

anotaaiApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config, response } = error

        if (response?.status === 401 && !config._retry) {
            config._retry = true
            const token = await refreshToken()
            config.headers.Authorization = `Bearer ${token}`
            return anotaaiApi(config)
        }

        return Promise.reject(error)
    }
)

module.exports = { anotaaiApi }