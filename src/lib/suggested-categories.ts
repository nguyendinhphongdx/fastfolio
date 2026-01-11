import { prisma } from "@/lib/prisma"
import { DEFAULT_SUGGESTED_CATEGORIES } from "@/constants/suggested-categories"

/**
 * Create default system categories for a portfolio
 * Called when a new portfolio is created
 */
export async function createDefaultCategories(portfolioId: string) {
  // Check if categories already exist
  const existingCategories = await prisma.suggestedCategory.findMany({
    where: { portfolioId },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
    },
  })

  if (existingCategories.length > 0) {
    return existingCategories
  }

  // Create default categories with their questions
  const categories = await Promise.all(
    DEFAULT_SUGGESTED_CATEGORIES.map(async (cat) => {
      return prisma.suggestedCategory.create({
        data: {
          portfolioId,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          isSystem: true,
          order: cat.order,
          questions: {
            create: cat.defaultQuestions.map((text, index) => ({
              portfolioId,
              text,
              order: index,
            })),
          },
        },
        include: {
          questions: true,
        },
      })
    })
  )

  return categories
}

/**
 * Get all categories for a portfolio with their questions
 */
export async function getCategoriesWithQuestions(portfolioId: string) {
  return prisma.suggestedCategory.findMany({
    where: { portfolioId },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  })
}

/**
 * Ensure categories exist for a portfolio (create defaults if needed)
 */
export async function ensureCategoriesExist(portfolioId: string) {
  const categories = await getCategoriesWithQuestions(portfolioId)

  if (categories.length === 0) {
    return createDefaultCategories(portfolioId)
  }

  return categories
}
