import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, PlusCircle, Trash2 } from 'lucide-react'
import { getSavedTemplates, deleteTemplate, type SavedTemplate } from '@/lib/templates'

export default function TemplateLibrary() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<SavedTemplate[]>([])

  useEffect(() => {
    setTemplates(getSavedTemplates())
  }, [])

  const handleDelete = (id: string) => {
    deleteTemplate(id)
    setTemplates(getSavedTemplates())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supply Cache</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Templates and saved configurations for future expeditions
          </p>
        </div>
        <Button asChild>
          <Link to="/campaigns/new" className="gap-2">
            <PlusCircle className="w-4 h-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Save a template from a positive drift event on the Campaign Tracker. Go to a campaign → Drift Analysis → find a positive drift card → click &quot;Save as Template&quot;.
            </p>
            <Button asChild variant="outline">
              <Link to="/dashboard">View campaigns</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Card key={t.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base truncate">{t.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(t.id)}
                    aria-label="Delete template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {t.sourcePhaseName && (
                  <Badge variant="secondary" className="text-xs w-fit">
                    From: {t.sourcePhaseName}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pt-0 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">{t.description || 'No description.'}</p>
                <p className="text-xs text-muted-foreground mt-3">
                  Saved {new Date(t.createdAt).toLocaleDateString()}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => navigate('/campaigns/new', { state: { template: t } })}
                >
                  Use template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
