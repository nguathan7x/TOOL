import { Avatar } from '../../../../components/ui/Avatar';
import { Badge } from '../../../../components/ui/Badge';
import type { ProjectMembership } from '../../../admin/types';

export function ProjectMembersView({ members }: { members: ProjectMembership[] }) {
  return (
    <div className="space-y-3">
      <div className="mb-3 shrink-0 border-b border-white/10 pb-3">
        <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Members</p>
        <h2 className="mt-1 text-base font-semibold text-white">Project collaborators and roles</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <div key={member.id} className="rounded-2xl border border-white/10 bg-[#101a2d] p-4">
            <div className="flex items-center gap-3">
              <Avatar name={member.user?.fullName ?? member.user?.email ?? member.userId} src={member.user?.avatarUrl} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{member.user?.fullName ?? member.user?.email ?? 'Unknown member'}</p>
                <p className="truncate text-xs text-slate-300">{member.user?.email ?? 'No email'}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="info">{member.role}</Badge>
              <Badge>{member.status}</Badge>
              {member.user?.specialization ? <Badge>{member.user.specialization}</Badge> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
