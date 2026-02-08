import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, AlertCircle } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import KanbanBoard from '../components/kanban/KanbanBoard';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { supabase } from '../lib/supabase';
import { type Campaign } from '../types/campaign';

export default function CampaignKanban() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchCampaign = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setCampaign(data);
      } catch (err) {
        console.error('Error fetching campaign:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id]);

  if (!id) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Campaign ID not found</p>
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/campaigns/${id}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Campaign
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {campaign?.name || 'Campaign'} - Action Tracker
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Notion-style Kanban board for tracking marketer actions and performance correlations
              </p>
            </div>
          </div>
        </div>

        {/* Campaign Summary Card */}
        {campaign && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                  <Badge variant={campaign.status === 'in_progress' ? 'default' : 'secondary'}>
                    {campaign.status.replace('_', ' ')}
                  </Badge>
                </div>
                {campaign.operational_health !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Operational Health</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <TrendingUp
                          className={`h-4 w-4 ${
                            campaign.operational_health >= 80
                              ? 'text-green-600'
                              : campaign.operational_health >= 60
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        />
                        <span className="font-semibold text-sm">
                          {campaign.operational_health}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {campaign.drift_count !== undefined && campaign.drift_count > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Drift Events</p>
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span className="font-semibold text-sm">{campaign.drift_count}</span>
                    </div>
                  </div>
                )}
              </div>
              {campaign.primary_kpi && (
                <div className="text-right max-w-md">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Primary KPI</p>
                  <p className="text-sm text-gray-700 mt-1">{campaign.primary_kpi}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-blue-900">How to use this board</h3>
              <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>
                  <strong>Drag cards</strong> between columns to update action status
                </li>
                <li>
                  <strong>Red-highlighted cards</strong> indicate negative performance correlations detected by AI
                </li>
                <li>
                  <strong>Click "Revert"</strong> on alert banners to quickly undo actions causing performance drops
                </li>
                <li>
                  <strong>Use templates</strong> for quick action creation via the "New Action" button
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <KanbanBoard campaignId={id} />
      </div>
    </PageLayout>
  );
}
