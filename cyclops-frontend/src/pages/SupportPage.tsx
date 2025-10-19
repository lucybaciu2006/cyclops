import React, { useState } from 'react';
import { useLanguage } from '../contexts/language.context';
import { useAuth } from '../contexts/auth.context';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { SupportService } from '@/services/SupportService';

interface SupportTicket {
  userId: string;
  userName: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'feature' | 'general';
  tags: string[];
  status: 'open';
}

const SupportPage = () => {
  const { t } = useLanguage();
  const { principal } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    category: 'general' as const,
    tags: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!principal?.id) {
      toast.error(t('support.error'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse tags from comma-separated string
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const ticket: SupportTicket = {
        userId: principal.id,
        userName: principal.name,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
        tags: tags,
        status: 'open'
      };
      await SupportService.createTicket(ticket);

      toast.success(t('support.success'));
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'general',
        tags: ''
      });
      
    } catch (error) {
      console.error('Error creating support ticket:', error);
      toast.error(t('support.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 ">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('support.title')}
          </h1>
          <p className="text-gray-600">
            {t('support.subtitle')}
          </p>
        </div>

        {/* Support Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                {t('support.form.title')}
              </Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={t('support.form.titlePlaceholder')}
                required
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                {t('support.form.description')}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('support.form.descriptionPlaceholder')}
                required
                rows={6}
                className="mt-1"
              />
            </div>

            {/* Priority and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                  {t('support.form.priority')}
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('support.form.priority.low')}</SelectItem>
                    <SelectItem value="medium">{t('support.form.priority.medium')}</SelectItem>
                    <SelectItem value="high">{t('support.form.priority.high')}</SelectItem>
                    <SelectItem value="urgent">{t('support.form.priority.urgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                  {t('support.form.category')}
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">{t('support.form.category.technical')}</SelectItem>
                    <SelectItem value="billing">{t('support.form.category.billing')}</SelectItem>
                    <SelectItem value="feature">{t('support.form.category.feature')}</SelectItem>
                    <SelectItem value="general">{t('support.form.category.general')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSubmitting ? t('support.form.submitting') : t('support.form.submit')}
              </Button>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            {t('support.subtitle')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupportPage; 