<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">← 返回</ion-button>
        </ion-buttons>
        <ion-title>学习内容预览</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="preview-content">
      <div class="preview-container">
        <h1>📚 学习内容预览</h1>
        <div class="subhead">以下内容来自智能英语学习素材 · 聚焦 Web 开发核心概念</div>

        <!-- 段落 1 -->
        <div class="paragraph-card">
          <div class="paragraph-meta">
            <strong>段落 1</strong> · 主题：<span class="term">The Document Object Model</span>
          </div>
          <p>
            The <span class="term">Document Object Model (DOM)</span> connects web pages to scripts or
            programming languages by representing the structure of a document — such as the HTML
            representing a web page — in memory.
            <br /><br />
            Usually it refers to JavaScript, even though modeling HTML, SVG, or XML documents as objects
            are not part of the core JavaScript language.
            <br /><br />
            The DOM represents a document with a logical <span class="term">tree</span>.
            <br />
            Each branch of the tree ends in a <span class="term">node</span>, and each node contains
            <span class="term">objects</span>.
            <br /><br />
            <span class="term">DOM methods</span> allow programmatic access to the tree. With them, you
            can change the document's structure, style, or content.
            <br /><br />
            Nodes can also have <span class="term">event handlers</span> attached to them. Once an event
            is triggered, the event handlers get executed.
          </p>
        </div>

        <!-- 段落 2 -->
        <div class="paragraph-card">
          <div class="paragraph-meta">
            <strong>段落 2</strong> · 主题：<span class="term">Concepts and usage</span>
          </div>
          <p>
            The <span class="term">Document Object Model (DOM)</span> is a programming interface for web
            documents.
            <br />
            It represents the page so that programs can change the document structure, style, and content.
            <br /><br />
            The DOM represents the document as <span class="term">nodes</span> and
            <span class="term">objects</span>; that way, programming languages can interact with the page.
            <br /><br />
            A web page is a document that can be either displayed in the browser window or as the HTML
            source. In both cases, it is the same document but the
            <span class="term">Document Object Model (DOM)</span> representation allows it to be
            manipulated.
            <br /><br />
            As an object-oriented representation of the web page, it can be modified with a scripting
            language such as JavaScript.
            <br /><br />
            For example, the DOM specifies that the <span class="code">querySelectorAll</span> method in
            this code snippet must return a list of all the <span class="code">&lt;p&gt;</span> elements
            in the document:
          </p>
          <pre class="code-block">
const paragraphs = document.querySelectorAll("p");
// paragraphs[0] is the first &lt;p&gt; element
// paragraphs[1] is the second &lt;p&gt; element, etc.
alert(paragraphs[0].nodeName);</pre>
          <p style="margin-top: 14px">
            All of the properties, methods, and events available for manipulating and creating web pages
            are organized into objects.<br /><br />
            For example, the <span class="term">document</span> object that represents the document
            itself, any table objects that implement the <span class="term">HTMLTableElement</span> DOM
            interface for accessing HTML tables, and so forth, are all objects.
          </p>
        </div>

        <hr />

        <div class="footer-note">✨ 智能英语学习 · 通过真实技术文档提升专业英语阅读能力</div>
      </div>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <div class="footer-cta">
          <ion-button expand="block" color="primary" @click="startGuessing">
            开始猜词挑战 →
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonFooter,
} from '@ionic/vue'

const router = useRouter()
const route = useRoute()

/** 返回上一页 */
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/home')
  }
}

/** 开始猜词：把 HomePage 透传的 paragraphs_type / context 原样带给 StudyPage */
function startGuessing() {
  router.push({
    name: 'Study',
    query: {
      paragraphs_type: (route.query.paragraphs_type as string) || 'web',
      context: (route.query.context as string) || 'frontend',
    },
  })
}

</script>

<style scoped>
/* 明暗模式变量（与 Web.html 保持一致） */
:root {
  --bg: #ffffff;
  --text: #1e1e1e;
  --highlight: #c95a0c;
  --border-light: #e0e0e0;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1e1e1e;
    --text: #eaeaea;
    --highlight: #f39c12;
    --border-light: #3a3a3a;
  }
}

.preview-content {
  --background: var(--bg);
  color: var(--text);
}

.preview-container {
  max-width: 780px;
  margin: 24px auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Verdana, Arial, sans-serif;
  line-height: 1.8;
  color: var(--text);
}

h1 {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 6px;
  border-bottom: 3px solid var(--highlight);
  padding-bottom: 12px;
  color: var(--text);
}

.subhead {
  font-size: 1rem;
  color: #888;
  margin-bottom: 30px;
  font-style: italic;
}

.paragraph-card {
  background-color: var(--bg);
  border-left: 5px solid var(--highlight);
  padding: 20px 24px;
  margin-bottom: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  transition: 0.2s;
}

.paragraph-card p {
  margin: 0;
  font-size: 0.98rem;
}

.paragraph-meta {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

.paragraph-meta strong {
  color: var(--text);
}

.term {
  color: var(--highlight);
  font-weight: 500;
}

.code {
  background: rgba(128, 128, 128, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9em;
}

.code-block {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 14px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
  white-space: pre;
}

hr {
  border: none;
  border-top: 1px dashed #ccc;
  margin: 28px 0;
}

.footer-note {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--border-light);
  font-size: 0.9rem;
  color: #777;
  text-align: center;
}

.footer-cta {
  padding: 8px 16px;
}
</style>
