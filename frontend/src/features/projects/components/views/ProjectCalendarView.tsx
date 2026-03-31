import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/ui/EmptyState';
import type { ApiTask } from '../../api/projectsApi';
import { formatEstimate, monthLabel, prettyStatus, priorityTone, taskRangeSegmentTone, taskScheduleWindow } from '../../task-helpers';

type ProjectCalendarViewProps = {
  scheduledProjectTasks: ApiTask[];
  dueTodayProjectTasks: ApiTask[];
  overdueProjectTasks: ApiTask[];
  calendarAnchorDate: Date;
  todayAtMidnight: Date;
  calendarMonthGrid: Date[];
  calendarTaskMap: Map<string, ApiTask[]>;
  onCalendarAnchorDateChange: (next: Date) => void;
  onTaskOpen: (taskId: string) => void;
};

export function ProjectCalendarView(props: ProjectCalendarViewProps) {
  const { scheduledProjectTasks, dueTodayProjectTasks, overdueProjectTasks, calendarAnchorDate, todayAtMidnight, calendarMonthGrid, calendarTaskMap, onCalendarAnchorDateChange, onTaskOpen } = props;
  const nextDeadlines = scheduledProjectTasks.filter((task) => task.status !== 'DONE').slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Calendar</p>
          <h2 className="mt-1 text-base font-semibold text-white">Timeline and deadlines inside this project</h2>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0d1628] px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Scheduled</p>
          <p className="mt-1 text-lg font-semibold text-white">{scheduledProjectTasks.length}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#101a2d] p-4"><p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Due today</p><p className="mt-3 text-3xl font-semibold text-white">{dueTodayProjectTasks.length}</p><p className="mt-2 text-sm text-slate-200">Tasks crossing today's planning window.</p></div>
        <div className="rounded-2xl border border-white/10 bg-[#101a2d] p-4"><p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Overdue</p><p className="mt-3 text-3xl font-semibold text-white">{overdueProjectTasks.length}</p><p className="mt-2 text-sm text-slate-200">Tasks that slipped past deadline.</p></div>
        <div className="rounded-2xl border border-white/10 bg-[#101a2d] p-4"><p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Month</p><p className="mt-3 text-3xl font-semibold text-white">{monthLabel(calendarAnchorDate)}</p><p className="mt-2 text-sm text-slate-200">Schedule context for this project only.</p></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-white/10 bg-[#101a2d] p-5">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs uppercase tracking-[0.16em] text-[#8ae6d9]">Month view</p><h3 className="mt-2 text-xl font-semibold text-white">{monthLabel(calendarAnchorDate)}</h3></div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => onCalendarAnchorDateChange(new Date(calendarAnchorDate.getFullYear(), calendarAnchorDate.getMonth() - 1, 1))}>Prev</Button>
              <Button variant="secondary" onClick={() => onCalendarAnchorDateChange(new Date(todayAtMidnight.getFullYear(), todayAtMidnight.getMonth(), 1))}>Today</Button>
              <Button variant="secondary" onClick={() => onCalendarAnchorDateChange(new Date(calendarAnchorDate.getFullYear(), calendarAnchorDate.getMonth() + 1, 1))}>Next</Button>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.16em] text-slate-400">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day) => <div key={day} className="rounded-xl border border-white/10 bg-white/5 py-2">{day}</div>)}</div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarMonthGrid.map((date) => {
              const key = date.toISOString().slice(0, 10);
              const dayTasks = calendarTaskMap.get(key) ?? [];
              const isCurrentMonth = date.getMonth() === calendarAnchorDate.getMonth();
              const isToday = date.getTime() === todayAtMidnight.getTime();
              return (
                <div key={key} className={`min-h-[118px] rounded-[1.2rem] border p-3 ${isToday ? 'border-[#8f9cff]/55 bg-[#141f37]' : 'border-white/10 bg-white/[0.03]'} ${isCurrentMonth ? 'text-white' : 'text-slate-500'}`}>
                  <div className="flex items-center justify-between"><span className="text-sm font-semibold">{date.getDate()}</span>{dayTasks.length > 0 ? <span className="rounded-full border border-white/10 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-200">{dayTasks.length}</span> : null}</div>
                  <div className="mt-3 space-y-2">
                    {dayTasks.slice(0, 2).map((task) => <button key={task.id} type="button" onClick={() => onTaskOpen(task.id)} className={`block w-full px-2 py-2 text-left text-xs text-slate-200 transition hover:border-[#8f9cff]/35 hover:bg-white/[0.08] ${taskRangeSegmentTone(task, date) === 'single' ? 'rounded-xl border border-white/10 bg-white/[0.05]' : taskRangeSegmentTone(task, date) === 'start' ? 'rounded-l-xl rounded-r-md border border-cyan-300/30 bg-cyan-400/18' : taskRangeSegmentTone(task, date) === 'end' ? 'rounded-r-xl rounded-l-md border border-cyan-300/30 bg-cyan-400/18' : 'rounded-md border border-cyan-300/20 bg-cyan-400/12'}`}><p className="truncate font-semibold text-white">{task.title}</p><p className="mt-1 truncate text-slate-300">{taskScheduleWindow(task)}</p></button>)}
                    {dayTasks.length > 2 ? <p className="text-[0.7rem] text-slate-400">+{dayTasks.length - 2} more</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#101a2d] p-5">
            <div><p className="text-xs uppercase tracking-[0.16em] text-[#ffd79b]">Urgent</p><h3 className="mt-2 text-xl font-semibold text-white">Overdue</h3></div>
            <div className="mt-4 space-y-3">
              {overdueProjectTasks.length > 0 ? overdueProjectTasks.slice(0, 5).map((task) => <div key={task.id} className="rounded-2xl border border-white/10 bg-white/6 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{task.title}</p><p className="mt-1 text-xs text-rose-200">{taskScheduleWindow(task)}</p></div><Badge tone={priorityTone(task.priority)}>{task.priority}</Badge></div><div className="mt-3 flex justify-end"><Button variant="secondary" onClick={() => onTaskOpen(task.id)}>Open</Button></div></div>) : <EmptyState title="No overdue work" description="Nothing in this project is past deadline." />}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#101a2d] p-5">
            <div><p className="text-xs uppercase tracking-[0.16em] text-[#8ae6d9]">Upcoming</p><h3 className="mt-2 text-xl font-semibold text-white">Next deadlines</h3></div>
            <div className="mt-4 space-y-3">
              {nextDeadlines.map((task) => <div key={task.id} className="rounded-2xl border border-white/10 bg-white/6 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{task.title}</p><p className="mt-1 text-xs text-slate-300">{taskScheduleWindow(task)} - {prettyStatus(task.status)}</p><p className="mt-1 text-[0.72rem] text-slate-400">{formatEstimate(task.estimateHours)}</p></div><Badge>{task.taskType}</Badge></div></div>)}
              {nextDeadlines.length === 0 ? <EmptyState title="No scheduled work" description="Add a start or due date to make this timeline stronger." /> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
