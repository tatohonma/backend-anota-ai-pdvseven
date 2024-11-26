const axios = require("axios")

const anotaaiApi = axios.create({
    baseURL: "https://api-parceiros.anota.ai/partnerauth",
    headers: {
        Authorization: process.env.ANOTA_AI_TOKEN
    }
})

module.exports = { anotaaiApi }