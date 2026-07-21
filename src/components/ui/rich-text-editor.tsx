import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Button } from './button';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Link as LinkIcon, ImageIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-md max-w-full h-auto',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'min-h-[150px] w-full rounded-b-md bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm dark:prose-invert max-w-none',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('Image URL');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className={cn("flex flex-col rounded-md border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/50 p-1">
        {/* Formatting */}
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={cn("h-8 w-8 p-0", editor.isActive('bold') && "bg-muted text-foreground")}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={cn("h-8 w-8 p-0", editor.isActive('italic') && "bg-muted text-foreground")}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()} className={cn("h-8 w-8 p-0", editor.isActive('underline') && "bg-muted text-foreground")}>
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleStrike().run()} className={cn("h-8 w-8 p-0", editor.isActive('strike') && "bg-muted text-foreground")}>
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-[1px] h-4 bg-border mx-1" />

        {/* Headings */}
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={cn("h-8 w-8 p-0 font-bold", editor.isActive('heading', { level: 1 }) && "bg-muted text-foreground")}>H1</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cn("h-8 w-8 p-0 font-bold", editor.isActive('heading', { level: 2 }) && "bg-muted text-foreground")}>H2</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={cn("h-8 w-8 p-0 font-bold", editor.isActive('heading', { level: 3 }) && "bg-muted text-foreground")}>H3</Button>
        
        <div className="w-[1px] h-4 bg-border mx-1" />

        {/* Alignment */}
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'left' }) && "bg-muted text-foreground")}>
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'center' }) && "bg-muted text-foreground")}>
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'right' }) && "bg-muted text-foreground")}>
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-[1px] h-4 bg-border mx-1" />

        {/* Lists & Extras */}
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={cn("h-8 w-8 p-0", editor.isActive('bulletList') && "bg-muted text-foreground")}>
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={cn("h-8 w-8 p-0", editor.isActive('orderedList') && "bg-muted text-foreground")}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={setLink} className={cn("h-8 w-8 p-0", editor.isActive('link') && "bg-muted text-foreground")}>
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={addImage} className="h-8 w-8 p-0">
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} className="[&>div]:outline-none" />
    </div>
  );
}
