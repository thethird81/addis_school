"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, BookOpen, FolderOpen, FileText, GraduationCap } from "lucide-react";
import { useVideoWorkspace } from "@/contexts/VideoWorkspaceContext";
import { CurriculumItem, ActiveLesson } from "@/contexts/VideoWorkspaceContext";

interface TreeNodeProps {
  item: CurriculumItem;
  level: number;
  type: "grade" | "subject" | "content" | "subcontent";
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (lesson: ActiveLesson) => void;
  gradeId?: string;
  gradeName?: string;
  subjectId?: string;
  subjectName?: string;
  contentId?: string;
  contentName?: string;
}

function TreeNode({ 
  item, 
  level, 
  type, 
  expandedNodes, 
  onToggle, 
  onSelect,
  gradeId,
  gradeName,
  subjectId,
  subjectName,
  contentId,
  contentName 
}: TreeNodeProps) {
  const isExpanded = expandedNodes.has(item.id);
  
  // Check if this node has children based on the curriculum tree structure
  const hasChildren = (() => {
    switch (type) {
      case "grade":
        // Grade has subjects
        return item.subjects && Array.isArray(item.subjects) && item.subjects.length > 0;
      case "subject":
        // Subject has contents  
        return item.contents && Array.isArray(item.contents) && item.contents.length > 0;
      case "content":
        // Content has subcontents
        return item.subcontents && Array.isArray(item.subcontents) && item.subcontents.length > 0;
      case "subcontent":
        // Subcontent has no children
        return false;
      default:
        return false;
    }
  })();
  
  const getIcon = () => {
    switch (type) {
      case "grade": return <GraduationCap className="h-4 w-4" />;
      case "subject": return <BookOpen className="h-4 w-4" />;
      case "content": return <FolderOpen className="h-4 w-4" />;
      case "subcontent": return <FileText className="h-4 w-4" />;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent any default navigation behavior
    e.preventDefault();
    e.stopPropagation();
    
    if (type === "subcontent") {
      // When clicking a subcontent, select it as the active lesson
      onSelect({
        gradeId: gradeId || item.id,
        gradeName: gradeName || item.name,
        subjectId: subjectId,
        subjectName: subjectName,
        contentId: contentId,
        contentName: contentName,
        subcontentId: item.id,
        subcontentName: item.name,
      });
    } else {
      // For grade, subject, content - toggle expand/collapse
      onToggle(item.id);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
          level === 0 ? "font-medium" : level === 1 ? "ml-4" : level === 2 ? "ml-8" : "ml-12"
        } hover:bg-gray-100`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e as any);
          }
        }}
      >
        {hasChildren && (
          <span 
            className="p-0.5 hover:bg-gray-200 rounded inline-flex"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(item.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}
        {!hasChildren && <span className="w-5" />}
        {getIcon()}
        <span className="text-sm truncate">{item.name}</span>
      </div>
      
      {isExpanded && hasChildren && (
        <div>
          {type === "grade" && item.subjects?.map((subject) => (
            <TreeNode
              key={subject.id}
              item={subject}
              level={level + 1}
              type="subject"
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onSelect={onSelect}
              gradeId={item.id}
              gradeName={item.name}
            />
          ))}
          {type === "subject" && item.contents?.map((content) => (
            <TreeNode
              key={content.id}
              item={content}
              level={level + 1}
              type="content"
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onSelect={onSelect}
              gradeId={gradeId}
              gradeName={gradeName}
              subjectId={item.id}
              subjectName={item.name}
            />
          ))}
          {type === "content" && item.subcontents?.map((subcontent) => (
            <TreeNode
              key={subcontent.id}
              item={subcontent}
              level={level + 1}
              type="subcontent"
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onSelect={onSelect}
              gradeId={gradeId}
              gradeName={gradeName}
              subjectId={subjectId}
              subjectName={subjectName}
              contentId={item.id}
              contentName={item.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CurriculumTree() {
  const { curriculumTree, treeLoading, treeError, fetchCurriculumTree, activeLesson, setActiveLesson } = useVideoWorkspace();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCurriculumTree();
  }, [fetchCurriculumTree]);

  // Auto-expand parent nodes when active lesson is set
  useEffect(() => {
    if (activeLesson) {
      // In a real implementation, we would track and expand the path to the active subcontent
      // For now, just expand all grades
      const allGradeIds = new Set(curriculumTree.map(g => g.id));
      setExpandedNodes(allGradeIds);
    }
  }, [activeLesson, curriculumTree]);

  const handleToggle = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelect = (lesson: ActiveLesson) => {
    setActiveLesson(lesson);
  };

  if (treeLoading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Loading curriculum...
      </div>
    );
  }

  if (treeError) {
    return (
      <div className="p-4 text-center text-sm text-red-500">
        {treeError}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Curriculum
      </h3>
      {curriculumTree.length === 0 ? (
        <div className="px-2 py-4 text-center text-sm text-gray-400">
          No curriculum items found
        </div>
      ) : (
        <div className="space-y-1">
          {curriculumTree.map((grade) => (
            <TreeNode
              key={grade.id}
              item={grade}
              level={0}
              type="grade"
              expandedNodes={expandedNodes}
              onToggle={handleToggle}
              onSelect={handleSelect}
              gradeId={grade.id}
              gradeName={grade.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}