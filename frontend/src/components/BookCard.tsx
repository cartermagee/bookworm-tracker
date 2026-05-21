import Link from "next/link";
import type { components } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type BookDto = components["schemas"]["BookDto"];
type BookStatus = components["schemas"]["BookStatus"];

export const STATUS_LABELS: Record<BookStatus, string> = {
  wantToRead: "Want to Read",
  reading: "Reading",
  read: "Read",
};

export const STATUS_BADGE_VARIANT: Record<
  BookStatus,
  "default" | "secondary" | "outline"
> = {
  wantToRead: "outline",
  reading: "default",
  read: "secondary",
};

interface BookCardProps {
  book: BookDto;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/library/${book.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="flex gap-4 p-4">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- cover URLs are external dynamic; next/image requires known dimensions or remotePatterns for every CDN
            <img
              src={book.coverUrl}
              alt={book.title}
              className="h-20 w-14 rounded object-cover"
            />
          ) : (
            <div className="flex h-20 w-14 items-center justify-center rounded bg-gray-100 text-2xl">
              📖
            </div>
          )}
          <div className="flex flex-1 flex-col">
            <p className="font-medium leading-tight">{book.title}</p>
            <p className="text-sm text-gray-500">{book.author}</p>
            <div className="mt-auto flex items-center gap-2">
              <Badge variant={STATUS_BADGE_VARIANT[book.status]}>
                {STATUS_LABELS[book.status]}
              </Badge>
              {book.rating != null && (
                <span className="text-xs text-gray-500">
                  {"★".repeat(book.rating)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
