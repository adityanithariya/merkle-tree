import { TreeNodeData } from "./merkle-tree-visualizer";

const CustomNode = ({ nodeData }: { nodeData: TreeNodeData }) => {
  const isLeaf = nodeData.attributes?.isLeaf;
  const isHighlighted = nodeData.attributes?.highlighted;
  const isRoot = nodeData.attributes?.isRoot;

  // Determine colors based on node type
  const fillColor = isHighlighted
    ? '#22c55e'
    : isRoot
      ? '#f97316'
      : isLeaf
        ? '#8b5cf6'
        : '#374151';

  const strokeColor = isHighlighted
    ? '#4ade80'
    : isRoot
      ? '#fb923c'
      : '#6b7280';

  return (
    <g>
      <rect
        x="-50"
        y="-18"
        width="100"
        height="36"
        rx="6"
        ry="6"
        fill={fillColor}
        strokeWidth="0"
      />
      {isLeaf ?
        <>
          <circle
            cx="-25"
            cy="0"
            r="10"
            fill={nodeData.sender?.color}
            stroke="#fff"
            strokeWidth="1"
          />
          <text
            x="-25"
            y="3"
            textAnchor="middle"
            fill={"#fff"}
            fontWeight={'bold'}
            strokeWidth="0"
            fontSize="9"
            fontFamily="monospace"
          >
            {nodeData.sender?.name.charAt(0).toUpperCase()}
          </text>
          <g transform="translate(-1, 0)">
            <path d="M 2.653 -3.847 C 2.44 -3.638 2.44 -3.293 2.649 -3.081 L 5.183 -0.542 L -4.462 -0.542 C -4.758 -0.542 -5 -0.3 -5 0 C -5 0.3 -4.758 0.542 -4.462 0.542 L 5.178 0.542 L 2.646 3.08 C 2.437 3.293 2.44 3.634 2.649 3.847 C 2.862 4.056 3.198 4.056 3.412 3.843 L 6.846 0.384 C 6.892 0.334 6.93 0.279 6.959 0.212 C 6.988 0.146 7 0.075 7 0.005 C 7 -0.137 6.946 -0.271 6.846 -0.374 L 3.412 -3.834 C 3.207 -4.051 2.866 -4.055 2.653 -3.847 Z" fill="#fff" stroke="#fff" />
          </g>
          <circle
            cx="25"
            cy="0"
            r="10"
            fill={nodeData.receiver?.color}
            stroke="#fff"
            strokeWidth="1"
          />
          <text
            x="25"
            y="3"
            textAnchor="middle"
            fill={"#fff"}
            fontWeight={'bold'}
            strokeWidth="0"
            fontSize="9"
            fontFamily="monospace"
          >
            {nodeData.receiver?.name.charAt(0).toUpperCase()}
          </text>
          <text
            x="0"
            y="30"
            textAnchor="middle"
            fill={"#fff"}
            fontWeight={'bold'}
            strokeWidth="0"
            fontSize="9"
            fontFamily="monospace"
          >
            {nodeData.name}
          </text>
        </>
        :
        <>
          <text
            x="0"
            y="-2"
            textAnchor="middle"
            fill={"#fff"}
            fontWeight={'bold'}
            strokeWidth="0"
            fontSize="9"
            fontFamily="monospace"
          >
            {nodeData.name}
          </text>
          <text
            x="0"
            y="10"
            textAnchor="middle"
            fill={"#fff"}
            fontWeight={'bold'}
            strokeWidth="0"
            fontSize="7"
            fontFamily="monospace"
          >
            {isRoot ? 'root' : 'node'}
          </text>
        </>
      }
    </g>
  );
};

export default CustomNode;