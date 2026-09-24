const axios = require("axios")

const TOKEN_URL = "https://gateway-partners.anota.ai/integ/integ-oauth-api/oauth-client/token"

let cachedToken = null
let refreshPromise = null

async function fetchNewToken() {
    const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.ANOTA_AI_CLIENT_ID,
        client_secret: process.env.ANOTA_AI_CLIENT_SECRET
    })

    const { data } = await axios.post(TOKEN_URL, body)
    return data.accessToken
}

function getCachedToken() {
    return cachedToken
}

function refreshToken() {
    if (!refreshPromise) {
        refreshPromise = fetchNewToken()
            .then((token) => {
                cachedToken = token
                return token
            })
            .finally(() => {
                refreshPromise = null
            })
    }
    return refreshPromise
}

module.exports = { getCachedToken, refreshToken }
