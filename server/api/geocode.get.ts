export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { lat, long } = query

  const url = `http://apina.address.gov.sa/NationalAddress/v3.1/Address/address-geocode?lat=${lat}&long=${long}`

  try {
    const response = await $fetch(url)
    return response
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Geocode API error: ${message}`
    })
  }
})