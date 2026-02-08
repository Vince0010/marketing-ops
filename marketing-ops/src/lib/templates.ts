const STORAGE_KEY = 'marketing_ops_templates'

export interface SavedTemplate {
  id: string
  name: string
  description: string
  createdAt: string
  sourcePhaseName?: string
}

export function getSavedTemplates(): SavedTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedTemplate[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveTemplate(template: Omit<SavedTemplate, 'id' | 'createdAt'>): SavedTemplate {
  const list = getSavedTemplates()
  const newOne: SavedTemplate = {
    ...template,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  list.unshift(newOne)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  return newOne
}

export function deleteTemplate(id: string): void {
  const list = getSavedTemplates().filter((t) => t.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}
