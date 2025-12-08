<script setup lang="ts">
import MarkdownRender from 'markstream-vue';

defineProps<{
  content: string;
  streaming?: boolean;
}>();

defineEmits<{
  locate: [pos: { row: number; col: number }];
  selectBook: [book: any];
}>();
</script>

<template>
  <div class="message-content prose prose-sm prose-stone max-w-none">
    <ClientOnly>
      <MarkdownRender :content="content" />
    </ClientOnly>
    <!-- Streaming cursor -->
    <span v-if="streaming" class="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-stone-500" />
  </div>
</template>

<style>
.message-content {
  /* 基础样式 */
  font-size: 0.875rem;
  line-height: 1.6;
}

.message-content p {
  margin: 0.5em 0;
}

.message-content p:first-child {
  margin-top: 0;
}

.message-content p:last-child {
  margin-bottom: 0;
}

.message-content ul,
.message-content ol {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.message-content li {
  margin: 0.25em 0;
}

.message-content code {
  background: rgba(0, 0, 0, 0.05);
  padding: 0.125em 0.375em;
  border-radius: 0.25em;
  font-size: 0.85em;
}

.message-content pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 0.75em 1em;
  border-radius: 0.5em;
  overflow-x: auto;
  margin: 0.75em 0;
}

.message-content pre code {
  background: none;
  padding: 0;
  color: inherit;
}

.message-content blockquote {
  border-left: 3px solid #d1d5db;
  padding-left: 1em;
  margin: 0.75em 0;
  color: #6b7280;
}

.message-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.75em 0;
  font-size: 0.8125rem;
}

.message-content th,
.message-content td {
  border: 1px solid #e5e7eb;
  padding: 0.5em 0.75em;
  text-align: left;
}

.message-content th {
  background: #f9fafb;
  font-weight: 600;
}

.message-content a {
  color: #3b82f6;
  text-decoration: none;
}

.message-content a:hover {
  text-decoration: underline;
}

.message-content strong {
  font-weight: 600;
}

.message-content em {
  font-style: italic;
}

.message-content h1,
.message-content h2,
.message-content h3,
.message-content h4 {
  font-weight: 600;
  margin: 1em 0 0.5em;
  line-height: 1.3;
}

.message-content h1 {
  font-size: 1.25em;
}

.message-content h2 {
  font-size: 1.125em;
}

.message-content h3 {
  font-size: 1em;
}

.message-content hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1em 0;
}
</style>
