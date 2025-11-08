import React from 'react';
import type { ToolCall } from '../types';

interface ToolCallDisplayProps {
  toolCall: ToolCall;
}

const isArrayOfObjects = (data: any): data is Record<string, any>[] => {
  return Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null && !Array.isArray(data[0]);
};

const toTitleCase = (str: string) => {
    return str.replace(/_/g, ' ').replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    );
};


export const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({ toolCall }) => {
  
  const findTabularData = (args: any): Record<string, any>[] | null => {
    if (isArrayOfObjects(args)) {
      return args;
    }
    if (typeof args === 'object' && args !== null) {
      for (const key in args) {
        if (isArrayOfObjects(args[key])) {
          return args[key];
        }
      }
    }
    return null;
  };
  
  const renderContent = () => {
    const tableData = findTabularData(toolCall.args);
    
    if (tableData && tableData.length > 0) {
      const headers = Object.keys(tableData[0]);
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                {headers.map(header => (
                  <th key={header} className="text-left font-semibold p-3">{toTitleCase(header)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex} className="even:bg-gray-50/50">
                  {headers.map(header => (
                    <td key={`${rowIndex}-${header}`} className="p-3 align-top">{String(row[header] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
       <div className="p-3 bg-gray-50 overflow-x-auto">
        <pre className="text-xs text-gray-600">
          <code>{JSON.stringify(toolCall.args, null, 2)}</code>
        </pre>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg my-3 text-sm animate-fade-in shadow overflow-hidden">
      <div className="flex items-center gap-3 p-3 border-b border-gray-300 bg-gray-50">
        <span className="text-xl">⚙️</span>
        <div>
          <span className="font-semibold text-gray-700">Tool Call: Executing</span>
          <p className="font-mono text-indigo-600 text-xs">{toolCall.functionName}</p>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};
