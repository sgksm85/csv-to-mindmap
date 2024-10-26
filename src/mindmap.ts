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
  console.log("処理開始: 総行数", contents.length);
  
  // 最初のルートノードを作成
  const rootNode: Node = {
    nodeView: { content: "マインドマップ" },
    children: []
  };
  
  const visited: Record<string, Node> = {};
  const rootNodes: Record<string, Node> = {};

  for (const row of contents) {
    const values = Object.values(row);
    if (!values[0]) continue;
    
    // ルートノードの処理
    const rootValue = values[0];
    if (!rootNodes[rootValue]) {
      const node = { nodeView: { content: rootValue }, children: [] };
      rootNodes[rootValue] = node;
      rootNode.children.push(node); // 直接最上位ルートの子として追加
    }

    let currentParent = rootNodes[rootValue];
    let currentPath = rootValue;

    // 2列目以降を順次処理
    for (let i = 1; i < values.length; i++) {
      if (!values[i]) continue;
      
      currentPath = `${currentPath}-${values[i]}`;
      
      if (!visited[currentPath]) {
        const node = { nodeView: { content: values[i] }, children: [] };
        visited[currentPath] = node;
        currentParent.children.push(node);
      }
      
      currentParent = visited[currentPath];
    }
  }

  console.log("処理完了: ルートノード数", Object.keys(rootNodes).length);
  return rootNode;
};

const convertMarkdownToCsvFormat = (markdownText: string): DSVRowArray<string> => {
  const lines = markdownText.split('\n').filter(line => line.trim());
  const rows: Array<{ [key: string]: string }> = [];
  
  let currentH1 = '';
  let currentH2 = '';
  
  console.log('Input Markdown:', markdownText); // デバッグ用
  
  for (const line of lines) {
    // HTML形式のタグをパー
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

    // ビューポート取得
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

