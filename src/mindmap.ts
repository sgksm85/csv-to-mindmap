import { DSVRowArray } from "d3-dsv";

interface Node {
  nodeView: { content: string };
  children: Node[];
}

/**
 * Create graph from CSV rows
 *
 * @param contents CSV rows
 * @returns Schema that can be directly passed to createMindmapNode
 */
const createGraphFromCsv = (contents: DSVRowArray<string>) => {
  console.log("CSV contents:", contents); // デバッグ用：入力データの確認
  
  let root: Node | undefined;
  const visited: Record<string, Node> = {};
  const levelMap: Record<string, Node> = {};

  // 最初に列名を確認
  console.log("Column names:", contents.columns); // デバッグ用：列名の確認

  for (const row of contents) {
    let currentParent: Node | undefined;
    
    // 列の値を確認
    console.log("Processing row:", row); // デバッグ用：各行の内容確認
    
    // 0列目（Root）の処理
    const rootValue = row['0'];  // 数値インデックスで参照
    if (rootValue && !levelMap[rootValue]) {
      const node = { nodeView: { content: rootValue }, children: [] };
      levelMap[rootValue] = node;
      if (!root) root = node;
    }
    currentParent = levelMap[rootValue!];

    // 1列目（Level2）の処理
    const level2Value = row['1'];  // 数値インデックスで参照
    if (level2Value) {
      const key = `${rootValue}-${level2Value}`;
      if (!visited[key]) {
        const node = { nodeView: { content: level2Value }, children: [] };
        visited[key] = node;
        currentParent?.children.push(node);
      }
      currentParent = visited[key];
    }

    // 2列目（Level3）の処理
    const level3Value = row['2'];  // 数値インデックスで参照
    if (level3Value) {
      const key = `${rootValue}-${level2Value}-${level3Value}`;
      if (!visited[key]) {
        const node = { nodeView: { content: level3Value }, children: [] };
        visited[key] = node;
        currentParent?.children.push(node);
      }
    }
  }

  console.log("Created root node:", root); // デバッグ用：作成されたデータ構造の確認
  return root;
};

const convertMarkdownToCsvFormat = (markdownText: string): DSVRowArray<string> => {
  const lines = markdownText.split('\n').filter(line => line.trim());
  const rows: Array<{ [key: string]: string }> = [];
  
  let currentH1 = '';
  let currentH2 = '';
  
  console.log('Input Markdown:', markdownText); // デバッグ用
  
  for (const line of lines) {
    // HTML形式のタグをパー��
    const h1Match = line.match(/<h1>(.+?)<\/h1>/);
    const h2Match = line.match(/<h2>(.+?)<\/h2>/);
    const liMatch = line.match(/<li>(.+?)<\/li>/);
    
    if (h1Match) {
      currentH1 = h1Match[1].trim();
      console.log('Found H1:', currentH1); // デバッグ用
    } else if (h2Match) {
      currentH2 = h2Match[1].trim();
      console.log('Found H2:', currentH2); // デバッグ用
    } else if (liMatch && currentH1 && currentH2) {
      const row = {
        '0': currentH1,
        '1': currentH2,
        '2': liMatch[1].trim()
      };
      rows.push(row);
      console.log('Added row:', row); // デバッグ用
    }
  }

  const result = rows as unknown as DSVRowArray<string>;
  result.columns = ['0', '1', '2'];
  
  Object.defineProperty(result, 'length', {
    value: rows.length,
    enumerable: false
  });

  result[Symbol.iterator] = function* () {
    for (let i = 0; i < rows.length; i++) {
      yield rows[i];
    }
  };
  
  return result;
};

const createGraphFromMarkdown = async (markdownText: string) => {
  const csvFormatData = convertMarkdownToCsvFormat(markdownText);
  console.log('Before creating graph:', csvFormatData); // デバッグ用
  const result = createGraphFromCsv(csvFormatData);
  console.log('After creating graph:', result); // デバッグ用
  return result;
};

// 親ノードを探す補助関数
const findParentNode = (root: Node, target: Node): Node | null => {
  if (root.children.includes(target)) {
    return root;
  }
  for (const child of root.children) {
    const found = findParentNode(child, target);
    if (found) return found;
  }
  return null;
};

// レベルに基づいて親ノードを探す補助関数
const findParentNodeByLevel = (root: Node, targetLevel: number, currentLevel = 1): Node | null => {
  if (currentLevel === targetLevel - 1) {
    return root;
  }
  for (const child of root.children) {
    const found = findParentNodeByLevel(child, targetLevel, currentLevel + 1);
    if (found) return found;
  }
  return null;
};

/**
 * Create mindmap from CSV or Markdown data
 *
 * @param contents CSV or Markdown data
 */
export const createMindmap = async (contents: DSVRowArray<string> | string) => {
  let root;

  try {
    // データの処理
    if (Array.isArray(contents)) {
      root = createGraphFromCsv(contents);
    } else {
      root = await createGraphFromMarkdown(contents);
    }

    if (!root) {
      throw new Error('マインドマップのデータが見つかりません');
    }

    console.log('作成するマインドマップの構造:', JSON.stringify(root, null, 2));

    // ビューポート��取得
    const viewport = await miro.board.viewport.get();
    const centerX = viewport.x + (viewport.width * 0.4);
    const centerY = viewport.y + (viewport.height / 2);

    // マインドマップノードを作成
    await miro.board.experimental.createMindmapNode({
      nodeView: root.nodeView,
      x: centerX,
      y: centerY,
      children: root.children
    });

    console.log('マインドマップの作成が完了しました');

  } catch (error) {
    console.error('マインドマップ作成中にエラーが発生:', error);
    throw error;
  }
};
