const axios = require("axios")
const { getCachedToken, refreshToken } = require("./anotaaiAuth")

const anotaaiApi = axios.create({
    baseURL: "https://api-parceiros.anota.ai/partnerauth"
})

anotaaiApi.interceptors.request.use((config) => {
    const token = getCachedToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
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