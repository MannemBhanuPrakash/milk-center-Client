import type { FatRate } from "../types"

export const calculateRate = (fatPercentage: number, fatRates: FatRate[]): number => {
  if (!fatRates || fatRates.length === 0) {
    return 0
  }

  const exactMatch = fatRates.find((rate) => rate.fatPercentage === fatPercentage)
  if (exactMatch) return exactMatch.rate

  const sortedRates = [...fatRates].sort((a, b) => a.fatPercentage - b.fatPercentage)

  if (fatPercentage <= sortedRates[0].fatPercentage) {
    return sortedRates[0].rate
  }

  if (fatPercentage >= sortedRates[sortedRates.length - 1].fatPercentage) {
    return sortedRates[sortedRates.length - 1].rate
  }

  for (let i = 0; i < sortedRates.length - 1; i++) {
    const lower = sortedRates[i]
    const upper = sortedRates[i + 1]

    if (fatPercentage >= lower.fatPercentage && fatPercentage <= upper.fatPercentage) {
      const ratio = (fatPercentage - lower.fatPercentage) / (upper.fatPercentage - lower.fatPercentage)
      return Math.round(lower.rate + (upper.rate - lower.rate) * ratio)
    }
  }

  return sortedRates[0].rate
}
