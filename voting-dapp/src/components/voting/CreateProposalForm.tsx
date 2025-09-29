"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

interface CreateProposalFormProps {
  onSubmit: (proposal: {
    title: string;
    description: string;
    options: string[];
    duration: number;
    minVotesForReveal: number;
  }) => Promise<void>;
  isLoading: boolean;
}

export const CreateProposalForm = ({ onSubmit, isLoading }: CreateProposalFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [duration, setDuration] = useState(7); // days
  const [minVotesForReveal, setMinVotesForReveal] = useState(1);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
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

    if (!title.trim() || !description.trim()) {
      alert("Please fill in title and description");
      return;
    }

    const validOptions = options.filter(opt => opt.trim() !== "");
    if (validOptions.length < 2) {
      alert("Please provide at least 2 options");
      return;
    }

    if (duration < 1 || duration > 30) {
      alert("Duration must be between 1 and 30 days");
      return;
    }

    if (minVotesForReveal < 1) {
      alert("Minimum votes for reveal must be at least 1");
      return;
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      options: validOptions,
      duration: duration * 24 * 60 * 60, // Convert days to seconds
      minVotesForReveal,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Proposal</CardTitle>
        <CardDescription>
          Create a new voting proposal with encrypted ballot privacy
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proposal Title
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter proposal title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your proposal in detail"
              rows={4}
              required
            />
          </div>

          {/* Voting Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Voting Options
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                disabled={options.length >= 10}
              >
                Add Option
              </Button>
            </div>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voting Duration (days)
            </label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={1}
              max={30}
              required
            />
          </div>

          {/* Minimum Votes for Reveal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Votes for Result Reveal
            </label>
            <Input
              type="number"
              value={minVotesForReveal}
              onChange={(e) => setMinVotesForReveal(Number(e.target.value))}
              min={1}
              placeholder="Number of votes needed to reveal results"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Results will only be visible after this many people have voted
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" loading={isLoading}>
            {isLoading ? "Creating Proposal..." : "Create Proposal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
