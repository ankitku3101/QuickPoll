'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CreatePollForm({ onPollCreated }: { onPollCreated: (poll: any) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      setError('Please provide at least 2 options');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/polls', {
        title,
        description,
        options: validOptions,
      });
      setTitle('');
      setDescription('');
      setOptions(['', '']);
      const createdPoll = response.data;
      onPollCreated(createdPoll);
      toast.success('Poll created successfully!'); 
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background rounded-2xl shadow-2xl border border-border overflow-hidden">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-xl font-semibold tracking-tight">Create a new poll</h2>
          <p className="text-sm text-muted-foreground mt-1">Share your question with the community</p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Poll Question
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              placeholder="What would you like to ask?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-sm"
              placeholder="Add some context..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Options
            </label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="size-10 flex items-center justify-center rounded-lg bg-muted/50 border border-border hover:bg-destructive/10 hover:border-destructive/20 text-muted-foreground hover:text-destructive transition-all shrink-0"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium bg-muted/50 border border-border hover:bg-muted rounded-lg transition-all"
              >
                <Plus className="size-4" />
                Add option
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium text-sm transition-all"
          >
            {loading ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </form>
    </div>
  );
}