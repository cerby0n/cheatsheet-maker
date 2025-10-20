import { Cheatsheet, Section } from '../types';
import SectionComponent from './Section';

interface EditorProps {
  cheatsheet: Cheatsheet;
  onUpdate: (cheatsheet: Cheatsheet) => void;
  isEditMode: boolean;
}

export default function Editor({ cheatsheet, onUpdate, isEditMode }: EditorProps) {

  const handleUpdateSection = (sectionId: string, updatedSection: Section) => {
    const updated: Cheatsheet = {
      ...cheatsheet,
      sections: cheatsheet.sections.map((s) =>
        s.id === sectionId ? updatedSection : s
      ),
    };

    onUpdate(updated);
  };

  const handleDeleteSection = (sectionId: string) => {
    const updated: Cheatsheet = {
      ...cheatsheet,
      sections: cheatsheet.sections.filter((s) => s.id !== sectionId),
    };

    onUpdate(updated);
  };

  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = cheatsheet.sections.findIndex((s) => s.id === sectionId);
    if (index === -1) return;

    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === cheatsheet.sections.length - 1)
      return;

    const newSections = [...cheatsheet.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    [newSections[index], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[index],
    ];

    const updated: Cheatsheet = {
      ...cheatsheet,
      sections: newSections,
    };

    onUpdate(updated);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 w-full">
      <div className="h-full w-full px-3 py-3">
        {/* Sections */}
        {cheatsheet.sections.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">
              No sections yet. Add your first section to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cheatsheet.sections.map((section, index) => (
              <SectionComponent
                key={section.id}
                section={section}
                isFirst={index === 0}
                isLast={index === cheatsheet.sections.length - 1}
                isEditMode={isEditMode}
                onUpdate={(updated) => handleUpdateSection(section.id, updated)}
                onDelete={() => handleDeleteSection(section.id)}
                onMoveUp={() => handleMoveSection(section.id, 'up')}
                onMoveDown={() => handleMoveSection(section.id, 'down')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
