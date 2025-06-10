
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, ThumbsUp, MessageSquare, Filter, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkshopReview {
  id: string;
  workshop_id: string;
  customer_id: string;
  rating: number;
  review_text: string;
  service_type: string;
  created_at: string;
  customer?: {
    name: string;
    email: string;
  };
  helpful_count: number;
  response?: {
    text: string;
    responded_at: string;
    responded_by: string;
  };
}

interface WorkshopReviewSystemProps {
  workshopId: string;
  canRespond?: boolean;
}

const WorkshopReviewSystem: React.FC<WorkshopReviewSystemProps> = ({ 
  workshopId, 
  canRespond = false 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<WorkshopReview | null>(null);
  const [responseText, setResponseText] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch reviews
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['workshop-reviews', workshopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshop_reviews')
        .select(`
          *,
          customer:envio_users(name, email)
        `)
        .eq('workshop_id', workshopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WorkshopReview[];
    }
  });

  // Respond to review mutation
  const respondToReviewMutation = useMutation({
    mutationFn: async ({ reviewId, response }: { reviewId: string; response: string }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('workshop_review_responses')
        .insert({
          review_id: reviewId,
          response_text: response,
          responded_by: user.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-reviews', workshopId] });
      setShowResponseDialog(false);
      setResponseText('');
      setSelectedReview(null);
      toast({
        title: "Response Posted",
        description: "Your response has been posted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to post response: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Mark review as helpful
  const markHelpfulMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase.rpc('increment_review_helpful_count', {
        review_id: reviewId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-reviews', workshopId] });
    }
  });

  const handleRespondToReview = (review: WorkshopReview) => {
    setSelectedReview(review);
    setShowResponseDialog(true);
  };

  const submitResponse = () => {
    if (!selectedReview || !responseText.trim()) return;
    
    respondToReviewMutation.mutate({
      reviewId: selectedReview.id,
      response: responseText
    });
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    if (!reviews) return {};
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    
    return distribution;
  };

  const filteredReviews = reviews?.filter(review => {
    const matchesRating = filterRating === null || review.rating === filterRating;
    const matchesSearch = searchTerm === '' || 
      review.review_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRating && matchesSearch;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const averageRating = getAverageRating();
  const ratingDistribution = getRatingDistribution();

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            Customer Reviews
          </CardTitle>
          <CardDescription>
            {reviews?.length || 0} reviews • Average rating: {averageRating}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{averageRating}</div>
              {renderStars(Number(averageRating), 'md')}
              <div className="text-sm text-muted-foreground mt-2">
                Based on {reviews?.length || 0} reviews
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = ratingDistribution[rating as keyof typeof ratingDistribution] || 0;
                const percentage = reviews?.length ? (count / reviews.length) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-2">{rating}</span>
                    <Star className="h-3 w-3 text-yellow-400" />
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-yellow-400 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <div className="flex gap-1">
                <Button
                  variant={filterRating === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRating(null)}
                >
                  All
                </Button>
                {[5, 4, 3, 2, 1].map(rating => (
                  <Button
                    key={rating}
                    variant={filterRating === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterRating(rating)}
                  >
                    {rating}★
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No reviews found matching your criteria.
            </CardContent>
          </Card>
        ) : (
          filteredReviews?.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {review.customer?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-medium">{review.customer?.name || 'Anonymous'}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  <Badge variant="outline">{review.service_type}</Badge>
                </div>

                <p className="text-gray-700 mb-4">{review.review_text}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markHelpfulMutation.mutate(review.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Helpful ({review.helpful_count})
                    </Button>
                  </div>

                  {canRespond && !review.response && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRespondToReview(review)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Respond
                    </Button>
                  )}
                </div>

                {/* Workshop Response */}
                {review.response && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-primary">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>Workshop Response</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.response.responded_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{review.response.text}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
            <DialogDescription>
              Respond professionally to this customer review
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(selectedReview.rating)}
                  <span className="text-sm text-muted-foreground">
                    by {selectedReview.customer?.name}
                  </span>
                </div>
                <p className="text-sm">{selectedReview.review_text}</p>
              </div>

              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Write your response..."
                rows={4}
              />

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={submitResponse} disabled={!responseText.trim()}>
                  Post Response
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkshopReviewSystem;
