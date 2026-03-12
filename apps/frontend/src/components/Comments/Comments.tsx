import React, { useState, useEffect } from 'react';
import { getComments, addComment, Comment } from '../../api/incidents';

interface CommentsProps {
  incidentId: string;
  defaultAuthorName?: string;
  defaultAuthorEmail?: string;
}

export const Comments: React.FC<CommentsProps> = ({
  incidentId,
  defaultAuthorName = '',
  defaultAuthorEmail = ''
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [authorEmail, setAuthorEmail] = useState(defaultAuthorEmail);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [incidentId]);

  const fetchComments = async () => {
    setIsLoading(true);
    const fetchedComments = await getComments(incidentId);
    setComments(fetchedComments);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim() || !authorName.trim() || !authorEmail.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await addComment(incidentId, authorName, authorEmail, commentText);

    if (result.success) {
      setCommentText('');
      await fetchComments(); // Refresh comments
    } else {
      setError(result.error || 'Failed to add comment');
    }

    setIsSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-surface-card rounded-xl border border-line p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-text">Comments & Updates</h3>
        <span className="text-sm text-text-muted">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-8 text-text-muted">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-text-muted">
          No comments yet. Be the first to add an update!
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-surface-hover rounded-lg p-4 border border-line"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
                    {comment.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-text">{comment.authorName}</div>
                    <div className="text-xs text-text-muted">{comment.authorEmail}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      comment.source === 'jira'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}
                  >
                    {comment.source === 'jira' ? 'From Jira' : 'Local'}
                  </span>
                  <span className="text-xs text-text-muted">{formatDate(comment.createdAt)}</span>
                </div>
              </div>
              <p className="text-text whitespace-pre-wrap break-words">{comment.commentText}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="border-t border-line pt-6">
        <h4 className="font-semibold text-text mb-4">Add a comment</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="authorName" className="block text-sm font-medium text-text mb-2">
              Your Name
            </label>
            <input
              id="authorName"
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="form-input"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label htmlFor="authorEmail" className="block text-sm font-medium text-text mb-2">
              Your Email
            </label>
            <input
              id="authorEmail"
              type="email"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              className="form-input"
              placeholder="john.doe@example.com"
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="commentText" className="block text-sm font-medium text-text mb-2">
            Comment
          </label>
          <textarea
            id="commentText"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="form-input min-h-[120px]"
            placeholder="Add an update or comment about this incident..."
            required
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto px-6 py-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
    </div>
  );
};
