import { Star, StarHalf } from 'lucide-react';

interface RatingStarsProps {
    rating: number;
    count?: number;
    size?: 'sm' | 'md' | 'lg';
    showCount?: boolean;
}

export function RatingStars({ rating, count, size = 'md', showCount = true }: RatingStarsProps) {
    const sizeClasses = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    };

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div className="flex items-center gap-1">
            <div className="flex items-center">
                {/* Full stars */}
                {[...Array(fullStars)].map((_, i) => (
                    <Star
                        key={`full-${i}`}
                        className={`${sizeClasses[size]} fill-[#FFB400] text-[#FFB400]`}
                    />
                ))}

                {/* Half star */}
                {hasHalfStar && (
                    <StarHalf className={`${sizeClasses[size]} fill-[#FFB400] text-[#FFB400]`} />
                )}

                {/* Empty stars */}
                {[...Array(emptyStars)].map((_, i) => (
                    <Star
                        key={`empty-${i}`}
                        className={`${sizeClasses[size]} text-gray-300`}
                    />
                ))}
            </div>

            {/* Rating number */}
            <span className={`${textSizeClasses[size]} font-semibold text-gray-900`}>
                {rating.toFixed(1)}
            </span>

            {/* Count */}
            {showCount && count && (
                <span className={`${textSizeClasses[size]} text-gray-500`}>
                    ({count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}+)
                </span>
            )}
        </div>
    );
}
