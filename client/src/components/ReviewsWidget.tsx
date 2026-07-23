// Google Review widget placeholder. The brief asks for EmbedSocial (free tier)
// or Elfsight -- both require creating a third-party account first. Once Blast
// provides a widget ID, drop the embed script/markup in here and it will show
// automatically once MarketSettings.showReviewsWidget is turned on from /admin.
interface ReviewsWidgetProps {
  show: boolean;
}

export function ReviewsWidget({ show }: ReviewsWidgetProps) {
  if (!show) return null;

  return (
    <div className="reviews-widget">
      {/* TODO(Blast): paste EmbedSocial/Elfsight embed code here */}
      <p>Google reviews coming soon.</p>
    </div>
  );
}
