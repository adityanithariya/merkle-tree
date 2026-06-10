import React from "react";

export default function InfoCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div>
                <h3 className="font-medium text-zinc-200 mb-1">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
