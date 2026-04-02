import { Card, CardContent } from '@/components/ui/card';
import { NotebookPen } from 'lucide-react';

export default function AboutSection() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-6">
        <div className="flex items-center justify-center gap-2">
          <div className="bg-primary/10 text-primary flex shrink-0 items-center justify-center rounded-full p-2">
            <NotebookPen className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold">블로그 소개</h3>
        </div>
        <p className="text-muted-foreground text-center text-sm leading-relaxed break-keep">
          꾸준한 블로그 활동 보다는 옛날부터 공부하면서 notion에 메모했던 글들 중에 정리해서 작성한
          글들을 모아놓은 블로그입니다 :)
        </p>
      </CardContent>
    </Card>
  );
}
