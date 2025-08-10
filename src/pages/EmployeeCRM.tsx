import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, Building2, Phone, Mail } from 'lucide-react'

const EmployeeCRM = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Employee CRM</h1>
        <p className="text-muted-foreground">Manage employee details, communication, and relationship history</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Employees
            </CardTitle>
            <CardDescription>View and manage your employee records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Employees</span>
              <span className="text-lg font-semibold">0</span>
            </div>
            <Button className="w-full" disabled>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest interactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-md border">
                <Phone className="w-4 h-4" />
                <div>
                  <p className="text-sm font-medium">Phone call</p>
                  <p className="text-xs text-muted-foreground">No recent calls</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-md border">
                <Mail className="w-4 h-4" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">No recent emails</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-md border">
                <Building2 className="w-4 h-4" />
                <div>
                  <p className="text-sm font-medium">Department changes</p>
                  <p className="text-xs text-muted-foreground">No recent changes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default EmployeeCRM