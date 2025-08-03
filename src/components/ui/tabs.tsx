"use client";

import { useState, useRef, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface TabItem {
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: (string | TabItem)[];
  onTabChange?: (index: number) => void;
  initialActiveIndex?: number;
  iconOnly?: boolean;
  isCentered?: boolean;
  hasBottomBorder?: boolean;
}

export default function Tabs({
  tabs,
  onTabChange,
  initialActiveIndex = 0,
  iconOnly = false,
  isCentered = false,
  hasBottomBorder = true,
}: TabsProps) {
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeStyle, setActiveStyle] = useState({
    width: 0,
    transform: "translateX(0)",
  });
  const [hoverStyle, setHoverStyle] = useState({
    width: 0,
    transform: "translateX(0)",
  });

  // Helper function to get tab label
  const getTabLabel = (tab: string | TabItem): string => {
    return typeof tab === "string" ? tab : tab.label;
  };

  // Helper function to get tab icon
  const getTabIcon = (tab: string | TabItem): React.ReactNode | null => {
    return typeof tab === "string" ? null : tab.icon || null;
  };

  // Helper function to check if a tab has an icon
  const hasIcon = (tab: string | TabItem): boolean => {
    return typeof tab !== "string" && !!tab.icon;
  };

  useEffect(() => {
    setActiveIndex(initialActiveIndex);
  }, [initialActiveIndex]);

  useEffect(() => {
    if (onTabChange && tabRefs.current[activeIndex]) {
      onTabChange(activeIndex);
    }

    // Update the active indicator position and width
    const activeTab = tabRefs.current[activeIndex];
    if (activeTab) {
      const { width, left } = activeTab.getBoundingClientRect();
      const parentLeft =
        activeTab.parentElement?.getBoundingClientRect().left || 0;
      const offset = left - parentLeft;

      setActiveStyle({
        width,
        transform: `translateX(${offset}px)`,
      });
    }
  }, [activeIndex, onTabChange]);

  // Update hover indicator position and width
  const handleTabHover = (index: number | null) => {
    setHoveredIndex(index);

    if (index !== null) {
      const hoveredTab = tabRefs.current[index];
      if (hoveredTab) {
        const { width, left } = hoveredTab.getBoundingClientRect();
        const parentLeft =
          hoveredTab.parentElement?.getBoundingClientRect().left || 0;
        const offset = left - parentLeft;

        setHoverStyle({
          width,
          transform: `translateX(${offset}px)`,
        });
      }
    }
  };

  const handleTabClick = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div
      className={`${
        iconOnly || !hasBottomBorder ? "" : "border-b border-border"
      } ${isCentered ? "mx-auto" : ""}`}
    >
      {/* Desktop tabs - hidden on small screens */}
      <div className="hidden md:flex mt-2 overflow-x-auto relative">
        <div
          className="absolute h-full transition-all duration-300 ease-out bg-muted rounded-t-[8px] flex items-center border-b border-b-muted-foreground/50"
          style={{
            ...hoverStyle,
            opacity: hoveredIndex !== null ? 1 : 0,
          }}
        />
        {tabs.map((tab, index) => (
          <button
            key={`desktop-${index}`}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            onClick={() => handleTabClick(index)}
            onMouseEnter={() => handleTabHover(index)}
            onMouseLeave={() => handleTabHover(null)}
            className={`
              px-4 py-2 rounded-t-md text-sm font-medium whitespace-nowrap transition-colors duration-300
              focus:outline-none relative flex items-center gap-2
              ${index === 0 ? "" : ""}
              ${
                index === activeIndex ? "text-primary" : "text-muted-foreground"
              }
            `}
            aria-current={index === activeIndex ? "page" : undefined}
            title={iconOnly && hasIcon(tab) ? getTabLabel(tab) : undefined}
          >
            {getTabIcon(tab)}
            {(!iconOnly || !hasIcon(tab)) && getTabLabel(tab)}
          </button>
        ))}
        <div
          className="absolute bottom-0 h-[2px] bg-primary transition-all duration-300 ease-out"
          style={activeStyle}
        />
      </div>

      {/* Mobile dropdown selector - shown only on small screens */}
      <div className="md:hidden py-2 px-1 w-full mx-auto">
        <Select
          value={activeIndex.toString()}
          onValueChange={(value) => handleTabClick(Number(value))}
          aria-label="Select tab"
        >
          <SelectTrigger className="w-full mx-auto">
            <SelectValue placeholder="Select tab">
              <div className="flex items-center gap-2">
                {getTabIcon(tabs[activeIndex])}
                {getTabLabel(tabs[activeIndex])}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab, index) => (
              <SelectItem key={`mobile-${index}`} value={index.toString()}>
                <div className="flex items-center gap-2">
                  {getTabIcon(tab)}
                  {getTabLabel(tab)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
