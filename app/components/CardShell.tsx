"use client";

import React from "react";

type CardShellProps = {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
};

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

const CardShell: React.FC<CardShellProps> = ({
  children,
  className,
  as: Tag = "div",
}) => {
  return (
    <Tag
      className={cn(
        "relative overflow-hidden rounded-3xl border border-card-border/70 bg-card/60 shadow-xl backdrop-blur-xl",
        className
      )}
    >
      {children}
    </Tag>
  );
};

export default CardShell;
