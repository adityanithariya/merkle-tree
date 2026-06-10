import { cn } from '@/lib/utils'
import React from 'react'

const TruncatedHash = ({ hash, length = 6, className }: { hash: string, length?: number, className: string }) => {
    return (
        <div className={cn(className, 'flex gap-3')}>
            <span>

                {hash.slice(0, length)}
            </span>
            <span>...</span>
        </div>
    )
}

export default TruncatedHash