import type { FC } from 'react';
import { cn } from '@/lib/utils';

export interface BoxLoaderProps {
  className?: string;
}

export const BoxLoader: FC<BoxLoaderProps> = ({ className }) => {
  return (
    <div className={cn('box-loader', className)} aria-hidden>
      <div className="boxes">
        <div className="box box-1">
          <div className="face face-front" />
          <div className="face face-right" />
          <div className="face face-top" />
          <div className="face face-back" />
        </div>
        <div className="box box-2">
          <div className="face face-front" />
          <div className="face face-right" />
          <div className="face face-top" />
          <div className="face face-back" />
        </div>
        <div className="box box-3">
          <div className="face face-front" />
          <div className="face face-right" />
          <div className="face face-top" />
          <div className="face face-back" />
        </div>
        <div className="box box-4">
          <div className="face face-front" />
          <div className="face face-right" />
          <div className="face face-top" />
          <div className="face face-back" />
        </div>
      </div>
    </div>
  );
};

export default BoxLoader;
