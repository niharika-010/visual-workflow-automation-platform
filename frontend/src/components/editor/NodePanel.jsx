import React, { useState } from 'react';
import { NODE_DEFINITIONS } from '../../nodes/nodeDefinitions';
import { Search, Filter, GripVertical } from 'lucide-react';

const CATEGORIES = ['All', 'Triggers', 'Actions', 'Logic', 'Database'];

export const NodePanel = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const handleDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const allNodes = Object.values(NODE_DEFINITIONS);

  const filteredNodes = allNodes.filter((node) => {
    const matchesCategory =
      activeCategory === 'All' ? true : node.category === activeCategory;
    const matchesSearch =
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Group filtered nodes by category
  const groupedCategories = CATEGORIES.filter((c) => c !== 'All').map((cat) => ({
    category: cat,
    items: filteredNodes.filter((n) => n.category === cat),
  }));

  return (
    <aside className="w-72 bg-slate-900/80 border-r border-slate-800 flex flex-col min-h-[calc(100vh-4rem)] p-4 backdrop-blur-md shrink-0">
      
      {/* Search Header */}
      <div className="mb-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Node Catalog ({allNodes.length} Nodes)
        </h3>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Categories & Node List */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
        {groupedCategories.map((group) => {
          if (group.items.length === 0) return null;

          return (
            <div key={group.category} className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
                {group.category} ({group.items.length})
              </div>
              <div className="space-y-2">
                {group.items.map((node) => {
                  const Icon = node.icon;
                  return (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, node.type)}
                      className="group bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/40 rounded-xl p-2.5 transition-all cursor-grab active:cursor-grabbing flex items-center justify-between shadow-sm hover:shadow-indigo-500/10"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg border ${node.color} shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                            {node.label}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {node.description}
                          </div>
                        </div>
                      </div>
                      <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drag Helper Footer */}
      <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center font-medium">
        💡 Drag node onto canvas
      </div>

    </aside>
  );
};
