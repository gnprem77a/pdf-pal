import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Settings, CreditCard, FileText, LogOut, Crown, Zap, Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const planIcons = {
  free: Zap,
  pro: Crown,
  business: Building2,
};

const planLimits = {
  free: { files: 5, maxSize: 10, storage: 100 },
  pro: { files: -1, maxSize: 100, storage: 5000 },
  business: { files: -1, maxSize: 500, storage: 50000 },
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  if (!user) {
    navigate("/login");
    return null;
  }

  const PlanIcon = planIcons[user.plan];
  const limits = planLimits[user.plan];

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile updated",
      description: "Your profile has been saved.",
    });
  };

  // Mock usage data
  const usageData = {
    filesProcessed: 3,
    storageUsed: 45, // MB
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-lg">
                  {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
              <PlanIcon className="h-4 w-4" />
              <span className="capitalize">{user.plan} Plan</span>
            </Badge>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Subscription
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Files Processed Today
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {usageData.filesProcessed}
                      {limits.files > 0 && (
                        <span className="text-lg font-normal text-muted-foreground">
                          /{limits.files}
                        </span>
                      )}
                    </div>
                    {limits.files > 0 && (
                      <Progress 
                        value={(usageData.filesProcessed / limits.files) * 100} 
                        className="mt-2"
                      />
                    )}
                    {limits.files === -1 && (
                      <p className="text-sm text-muted-foreground mt-1">Unlimited</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Storage Used
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {usageData.storageUsed} MB
                      <span className="text-lg font-normal text-muted-foreground">
                        /{limits.storage >= 1000 ? `${limits.storage / 1000} GB` : `${limits.storage} MB`}
                      </span>
                    </div>
                    <Progress 
                      value={(usageData.storageUsed / limits.storage) * 100} 
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Max File Size
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{limits.maxSize} MB</div>
                    <p className="text-sm text-muted-foreground mt-1">per file</p>
                  </CardContent>
                </Card>
              </div>

              {user.plan === "free" && (
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="flex items-center justify-between py-6">
                    <div>
                      <h3 className="font-semibold text-foreground">Upgrade to Pro</h3>
                      <p className="text-sm text-muted-foreground">
                        Get unlimited files, larger uploads, and no watermarks
                      </p>
                    </div>
                    <Link to="/pricing">
                      <Button>
                        <Crown className="mr-2 h-4 w-4" />
                        Upgrade Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button type="submit">Save changes</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current">Current password</Label>
                      <Input id="current" type="password" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="new">New password</Label>
                        <Input id="new" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm">Confirm new password</Label>
                        <Input id="confirm" type="password" />
                      </div>
                    </div>
                    <Button type="submit">Update password</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Manage your subscription</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <PlanIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold capitalize">{user.plan} Plan</h3>
                        <p className="text-sm text-muted-foreground">
                          {user.plan === "free" ? "Free forever" : "Billed monthly"}
                        </p>
                      </div>
                    </div>
                    {user.plan !== "free" && (
                      <Button variant="outline">Manage Subscription</Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Plan Features</h4>
                    <ul className="space-y-2">
                      {user.plan === "free" && (
                        <>
                          <li className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            5 files per day
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            Up to 10 MB per file
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            All 20 PDF tools
                          </li>
                        </>
                      )}
                      {user.plan === "pro" && (
                        <>
                          <li className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            Unlimited files
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            Up to 100 MB per file
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            No watermarks
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            Batch processing
                          </li>
                        </>
                      )}
                      {user.plan === "business" && (
                        <>
                          <li className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            Everything in Pro
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            Up to 500 MB per file
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            Team collaboration
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            API access
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  {user.plan !== "business" && (
                    <Link to="/pricing">
                      <Button className="w-full">
                        <Crown className="mr-2 h-4 w-4" />
                        {user.plan === "free" ? "Upgrade to Pro" : "Upgrade to Business"}
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>

              {user.plan !== "free" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>View your past invoices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">No invoices yet.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Manage your app preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Preferences will be available soon.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Log out</h4>
                      <p className="text-sm text-muted-foreground">
                        Sign out of your account
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Delete account</h4>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button variant="destructive">Delete account</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
