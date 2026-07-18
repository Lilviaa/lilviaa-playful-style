import { CustomerTag, useUpdateCustomerTags } from "@/lib/admin/customers-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface CustomerTagsProps {
  customerId: string;
  tags: CustomerTag[];
}

export function CustomerTags({ customerId, tags }: CustomerTagsProps) {
  const { mutate: updateTags, isPending } = useUpdateCustomerTags();
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState("");

  const handleRemove = (tagToRemove: CustomerTag) => {
    updateTags({
      id: customerId,
      tags: tags.filter((t) => t !== tagToRemove),
    });
  };

  const handleAdd = () => {
    if (!newTag.trim()) return;
    const normalized = newTag.trim().toLowerCase().replace(/\s+/g, "_");
    if (tags.includes(normalized)) {
      setNewTag("");
      setIsAdding(false);
      return;
    }
    updateTags({
      id: customerId,
      tags: [...tags, normalized],
    });
    setNewTag("");
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") setIsAdding(false);
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "vip":
        return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200";
      case "high_value":
        return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200";
      case "repeat":
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          className={`capitalize flex items-center gap-1 ${getTagColor(tag)}`}
        >
          {tag.replace("_", " ")}
          <button
            onClick={() => handleRemove(tag)}
            disabled={isPending}
            className="hover:bg-black/10 rounded-full p-0.5 transition-colors disabled:opacity-50 ml-1"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {isAdding ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            size={10}
            className="h-6 text-xs px-2 py-0 w-24"
            placeholder="New tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // slight delay to allow click on add button to register
              setTimeout(() => setIsAdding(false), 200);
            }}
          />
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleAdd}>
            <Check className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-6 rounded-full border-dashed px-2 text-xs text-muted-foreground"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Tag
        </Button>
      )}
    </div>
  );
}

// Inline Check icon since it wasn't imported from lucide-react above
function Check(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
