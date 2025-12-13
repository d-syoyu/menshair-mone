// src/components/blog/NotionRenderer.tsx
// Renders Notion blocks as React components

import Image from "next/image";
import Link from "next/link";
import type {
  BlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

interface NotionRendererProps {
  blocks: BlockObjectResponse[];
}

// Rich text renderer
function RichText({ richText }: { richText: RichTextItemResponse[] }) {
  return (
    <>
      {richText.map((text, index) => {
        const { annotations, plain_text, href } = text;
        const { bold, italic, strikethrough, underline, code } = annotations;

        let element: React.ReactNode = plain_text;

        if (code) {
          element = (
            <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono">
              {element}
            </code>
          );
        }
        if (bold) {
          element = <strong className="font-medium">{element}</strong>;
        }
        if (italic) {
          element = <em>{element}</em>;
        }
        if (strikethrough) {
          element = <s>{element}</s>;
        }
        if (underline) {
          element = <u>{element}</u>;
        }
        if (href) {
          element = (
            <Link
              href={href}
              className="text-[var(--color-sage)] hover:underline"
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {element}
            </Link>
          );
        }

        return <span key={index}>{element}</span>;
      })}
    </>
  );
}

// Individual block renderer
function Block({ block }: { block: BlockObjectResponse & { children?: BlockObjectResponse[] } }) {
  switch (block.type) {
    case "paragraph": {
      const { rich_text } = block.paragraph;
      if (rich_text.length === 0) {
        return <div className="h-4" />;
      }
      return (
        <p className="text-[var(--color-warm-gray)] leading-relaxed mb-4">
          <RichText richText={rich_text} />
        </p>
      );
    }

    case "heading_1": {
      const { rich_text } = block.heading_1;
      return (
        <h2 className="text-2xl font-[family-name:var(--font-serif)] text-[var(--color-charcoal)] mt-10 mb-4">
          <RichText richText={rich_text} />
        </h2>
      );
    }

    case "heading_2": {
      const { rich_text } = block.heading_2;
      return (
        <h3 className="text-xl font-[family-name:var(--font-serif)] text-[var(--color-charcoal)] mt-8 mb-4">
          <RichText richText={rich_text} />
        </h3>
      );
    }

    case "heading_3": {
      const { rich_text } = block.heading_3;
      return (
        <h4 className="text-lg font-[family-name:var(--font-serif)] text-[var(--color-charcoal)] mt-6 mb-3">
          <RichText richText={rich_text} />
        </h4>
      );
    }

    case "bulleted_list_item": {
      const { rich_text } = block.bulleted_list_item;
      return (
        <li className="text-[var(--color-warm-gray)] mb-2 ml-6 list-disc">
          <RichText richText={rich_text} />
          {block.children && block.children.length > 0 && (
            <ul className="mt-2">
              {block.children.map((child) => (
                <Block key={child.id} block={child} />
              ))}
            </ul>
          )}
        </li>
      );
    }

    case "numbered_list_item": {
      const { rich_text } = block.numbered_list_item;
      return (
        <li className="text-[var(--color-warm-gray)] mb-2 ml-6 list-decimal">
          <RichText richText={rich_text} />
          {block.children && block.children.length > 0 && (
            <ol className="mt-2">
              {block.children.map((child) => (
                <Block key={child.id} block={child} />
              ))}
            </ol>
          )}
        </li>
      );
    }

    case "image": {
      const { image } = block;
      const src =
        image.type === "external" ? image.external.url : image.file.url;
      const caption =
        image.caption.length > 0
          ? image.caption.map((c) => c.plain_text).join("")
          : "";

      return (
        <figure className="my-8">
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <Image
              src={src}
              alt={caption || "Blog image"}
              fill
              className="object-cover"
              unoptimized // Notion images have signed URLs that expire
            />
          </div>
          {caption && (
            <figcaption className="text-sm text-center text-[var(--color-warm-gray)] mt-3">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "code": {
      const { rich_text, language } = block.code;
      const code = rich_text.map((t) => t.plain_text).join("");
      return (
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6">
          <code className={`language-${language || "text"} text-sm`}>
            {code}
          </code>
        </pre>
      );
    }

    case "quote": {
      const { rich_text } = block.quote;
      return (
        <blockquote className="border-l-4 border-[var(--color-gold)] pl-4 py-2 my-6 italic text-[var(--color-warm-gray)]">
          <RichText richText={rich_text} />
        </blockquote>
      );
    }

    case "callout": {
      const { rich_text, icon } = block.callout;
      const emoji = icon?.type === "emoji" ? icon.emoji : "💡";
      return (
        <div className="flex gap-3 p-4 bg-[var(--color-cream)] rounded-lg my-6">
          <span className="text-xl">{emoji}</span>
          <div className="text-[var(--color-warm-gray)]">
            <RichText richText={rich_text} />
          </div>
        </div>
      );
    }

    case "divider":
      return <hr className="my-8 border-[var(--color-gold)]/30" />;

    case "toggle": {
      const { rich_text } = block.toggle;
      return (
        <details className="my-4">
          <summary className="cursor-pointer font-medium text-[var(--color-charcoal)]">
            <RichText richText={rich_text} />
          </summary>
          {block.children && block.children.length > 0 && (
            <div className="pl-4 mt-2">
              {block.children.map((child) => (
                <Block key={child.id} block={child} />
              ))}
            </div>
          )}
        </details>
      );
    }

    case "video": {
      const { video } = block;
      const url =
        video.type === "external" ? video.external.url : video.file.url;

      // Check if it's a YouTube video
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = url.includes("youtu.be")
          ? url.split("/").pop()
          : new URL(url).searchParams.get("v");

        return (
          <div className="relative aspect-video my-8 rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }

      return (
        <video controls className="w-full my-8 rounded-lg">
          <source src={url} />
        </video>
      );
    }

    case "bookmark": {
      const { url, caption } = block.bookmark;
      const title = caption.length > 0
        ? caption.map(c => c.plain_text).join("")
        : url;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors my-6"
        >
          <p className="text-sm text-[var(--color-sage)] truncate">{url}</p>
          {title !== url && (
            <p className="text-[var(--color-charcoal)] mt-1">{title}</p>
          )}
        </a>
      );
    }

    default:
      // Unsupported block type
      return null;
  }
}

// Main renderer - groups list items
export default function NotionRenderer({ blocks }: NotionRendererProps) {
  const groupedBlocks: (BlockObjectResponse | BlockObjectResponse[])[] = [];
  let currentList: BlockObjectResponse[] = [];
  let currentListType: "bulleted" | "numbered" | null = null;

  // Group consecutive list items
  for (const block of blocks) {
    if (block.type === "bulleted_list_item") {
      if (currentListType === "bulleted") {
        currentList.push(block);
      } else {
        if (currentList.length > 0) {
          groupedBlocks.push([...currentList]);
        }
        currentList = [block];
        currentListType = "bulleted";
      }
    } else if (block.type === "numbered_list_item") {
      if (currentListType === "numbered") {
        currentList.push(block);
      } else {
        if (currentList.length > 0) {
          groupedBlocks.push([...currentList]);
        }
        currentList = [block];
        currentListType = "numbered";
      }
    } else {
      if (currentList.length > 0) {
        groupedBlocks.push([...currentList]);
        currentList = [];
        currentListType = null;
      }
      groupedBlocks.push(block);
    }
  }

  // Don't forget the last list
  if (currentList.length > 0) {
    groupedBlocks.push([...currentList]);
  }

  return (
    <div className="notion-content">
      {groupedBlocks.map((item, index) => {
        if (Array.isArray(item)) {
          // List group
          const listType = item[0].type === "bulleted_list_item" ? "ul" : "ol";
          const ListTag = listType;
          return (
            <ListTag key={index} className="my-4">
              {item.map((block) => (
                <Block key={block.id} block={block as BlockObjectResponse & { children?: BlockObjectResponse[] }} />
              ))}
            </ListTag>
          );
        }
        return <Block key={item.id} block={item as BlockObjectResponse & { children?: BlockObjectResponse[] }} />;
      })}
    </div>
  );
}
