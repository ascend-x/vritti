import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTrips } from '../api';
import { Card } from '../components/ui/index';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Kanban, MapPin, Truck, User, GripVertical } from 'lucide-react';

const COLUMNS = [
  { id: 'Draft', label: 'Draft', color: 'border-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800/50', badge: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300' },
  { id: 'Dispatched', label: 'Dispatched', color: 'border-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/10', badge: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' },
  { id: 'Completed', label: 'Completed', color: 'border-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/10', badge: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' },
  { id: 'Cancelled', label: 'Cancelled', color: 'border-red-400', bg: 'bg-red-50 dark:bg-red-900/10', badge: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' },
];

export default function KanbanBoard() {
  const { data, isLoading } = useQuery({
    queryKey: ['trips-kanban'],
    queryFn: () => getTrips(),
  });

  const trips = data?.data || [];

  const [columns, setColumns] = useState(null);

  const computedColumns = useMemo(() => {
    const cols = {};
    COLUMNS.forEach(c => { cols[c.id] = []; });
    trips.forEach(t => {
      if (cols[t.status]) cols[t.status].push(t);
    });
    return cols;
  }, [trips]);

  const activeColumns = columns || computedColumns;

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    // Only allow visual reorder within same column (real status changes need API calls)
    if (source.droppableId !== destination.droppableId) {
      // Visual-only cross-column move (no API call, demo only)
      const sourceCol = [...(activeColumns[source.droppableId] || [])];
      const destCol = [...(activeColumns[destination.droppableId] || [])];
      const [moved] = sourceCol.splice(source.index, 1);
      moved.status = destination.droppableId;
      destCol.splice(destination.index, 0, moved);
      setColumns({
        ...activeColumns,
        [source.droppableId]: sourceCol,
        [destination.droppableId]: destCol,
      });
    } else {
      const col = [...(activeColumns[source.droppableId] || [])];
      const [moved] = col.splice(source.index, 1);
      col.splice(destination.index, 0, moved);
      setColumns({ ...activeColumns, [source.droppableId]: col });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400">
          <Kanban className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-white tracking-tight">Kanban Board</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            Drag & drop trips between stages
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-zinc-500 py-12">Loading trips...</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-4 gap-4 min-h-[600px]">
            {COLUMNS.map(col => (
              <div key={col.id} className="flex flex-col">
                <div className={`flex items-center gap-2 mb-4 pb-3 border-b-2 ${col.color}`}>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${col.badge}`}>{col.label}</span>
                  <span className="text-xs text-zinc-500 font-mono ml-auto">{(activeColumns[col.id] || []).length}</span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 rounded-2xl p-2 space-y-2 transition-colors ${snapshot.isDraggingOver ? col.bg : 'bg-transparent'}`}
                    >
                      {(activeColumns[col.id] || []).map((trip, index) => (
                        <Draggable key={String(trip.id)} draggableId={String(trip.id)} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-white dark:bg-zinc-800 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'rotate-2 shadow-lg ring-2 ring-brand-400' : ''}`}
                            >
                              <div className="flex items-start gap-2">
                                <div {...provided.dragHandleProps} className="mt-0.5 text-zinc-400 hover:text-zinc-600">
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                    #{trip.id}
                                  </p>
                                  <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{trip.source} → {trip.destination}</span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                                      <User className="w-3 h-3" /> {trip.driver_name}
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                                      <Truck className="w-3 h-3" /> {trip.vehicle_reg}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
