/*
 * ===========================================================
 *  GYM MEMBERSHIP & FITNESS TRACKER  (C++ OOP Project)
 * ===========================================================
 *  OOP Concepts Demonstrated:
 *   - Abstraction     : Person, MembershipPlan (abstract base classes)
 *   - Inheritance     : Member, Trainer -> Person
 *                       BasicPlan, PremiumPlan, PlatinumPlan -> MembershipPlan
 *   - Polymorphism    : Virtual functions (displayInfo, getMonthlyFee ...)
 *   - Encapsulation   : Private data with public getters/setters & validations
 *   - Composition     : Member has FitnessTracker; FitnessTracker has Workouts
 *
 *  Compile:  g++ -std=c++14 gym_management.cpp -o gym
 *  Run    :  gym.exe
 * ===========================================================
 */

#include <iostream>
#include <vector>
#include <string>
#include <memory>
#include <iomanip>
#include <ctime>
#include <fstream>
#include <algorithm>
using namespace std;

// ---------------------------------------------------------
//  Helper functions (input validation & date formatting)
// ---------------------------------------------------------
string formatDate(time_t t) {
    char buf[20];
    strftime(buf, sizeof(buf), "%d-%m-%Y", localtime(&t));
    return string(buf);
}

string readLine(const string &prompt) {
    string s;
    cout << prompt;
    getline(cin, s);
    return s;
}

int readInt(const string &prompt, int lo, int hi) {
    while (true) {
        string s = readLine(prompt);
        try {
            int v = stoi(s);
            if (v >= lo && v <= hi) return v;
        } catch (...) {}
        cout << "  Invalid input. Enter a number between " << lo << " and " << hi << ".\n";
    }
}

double readDouble(const string &prompt, double lo, double hi) {
    while (true) {
        string s = readLine(prompt);
        try {
            double v = stod(s);
            if (v >= lo && v <= hi) return v;
        } catch (...) {}
        cout << "  Invalid input. Enter a value between " << lo << " and " << hi << ".\n";
    }
}

// ---------------------------------------------------------
//  1. Abstraction: Abstract Base Class MembershipPlan
// ---------------------------------------------------------
class MembershipPlan {
public:
    virtual ~MembershipPlan() {}
    virtual string getName() const = 0;
    virtual double getMonthlyFee() const = 0;
    virtual string getBenefits() const = 0;
    virtual double getPersonalTrainingDiscount() const = 0;  // percentage
};

// ---------------------------------------------------------
//  2. Inheritance: Derived Plans
// ---------------------------------------------------------
class BasicPlan : public MembershipPlan {
public:
    string getName() const override { return "Basic"; }
    double getMonthlyFee() const override { return 1000.0; }
    string getBenefits() const override { return "Gym floor access (6am - 10am)"; }
    double getPersonalTrainingDiscount() const override { return 0.0; }
};

class PremiumPlan : public MembershipPlan {
public:
    string getName() const override { return "Premium"; }
    double getMonthlyFee() const override { return 2000.0; }
    string getBenefits() const override { return "Full-day access + group classes"; }
    double getPersonalTrainingDiscount() const override { return 10.0; }
};

class PlatinumPlan : public MembershipPlan {
public:
    string getName() const override { return "Platinum"; }
    double getMonthlyFee() const override { return 3500.0; }
    string getBenefits() const override { return "Full-day access + classes + sauna + diet plan"; }
    double getPersonalTrainingDiscount() const override { return 25.0; }
};

// Factory Method for polymorphic plan instantiation
unique_ptr<MembershipPlan> createPlan(int choice) {
    switch (choice) {
        case 1:  return unique_ptr<MembershipPlan>(new BasicPlan());
        case 2:  return unique_ptr<MembershipPlan>(new PremiumPlan());
        default: return unique_ptr<MembershipPlan>(new PlatinumPlan());
    }
}

// ---------------------------------------------------------
//  Workout: Individual exercise log
// ---------------------------------------------------------
class Workout {
private:
    string exercise;
    int durationMin;
    double calories;
    string date;

public:
    Workout(const string &ex, int dur, double cal)
        : exercise(ex), durationMin(dur), calories(cal), date(formatDate(time(nullptr))) {}

    string getExercise() const { return exercise; }
    int getDuration() const { return durationMin; }
    double getCalories() const { return calories; }
    string getDate() const { return date; }

    void display() const {
        cout << left << setw(12) << date
             << setw(16) << exercise
             << setw(12) << durationMin
             << fixed << setprecision(1) << calories << " kcal\n";
    }
};

// ---------------------------------------------------------
//  FitnessTracker: Composition inside Member
// ---------------------------------------------------------
class FitnessTracker {
private:
    vector<Workout> workouts;
    vector<double> weightHistory;  // kg
    double heightCm;

public:
    FitnessTracker(double h = 170.0, double w = 70.0) : heightCm(h) {
        weightHistory.push_back(w);
    }

    double getCurrentWeight() const { return weightHistory.back(); }
    double getHeight() const { return heightCm; }

    void updateWeight(double w) { weightHistory.push_back(w); }

    double calculateBMI() const {
        double m = heightCm / 100.0;
        return getCurrentWeight() / (m * m);
    }

    static string bmiCategory(double bmi) {
        if (bmi < 18.5) return "Underweight";
        if (bmi < 25.0) return "Normal";
        if (bmi < 30.0) return "Overweight";
        return "Obese";
    }

    // Calories = MET * weight(kg) * hours
    void logWorkout(int exerciseChoice, int minutes) {
        static const char *names[] = {"Running", "Cycling", "Walking", "Swimming",
                                      "Weightlifting", "Yoga"};
        static const double met[] = {9.8, 7.5, 3.5, 8.0, 6.0, 2.5};
        int i = exerciseChoice - 1;
        double cal = met[i] * getCurrentWeight() * (minutes / 60.0);
        workouts.push_back(Workout(names[i], minutes, cal));
        cout << "  Workout logged! You burned approx. " << fixed << setprecision(1)
             << cal << " kcal.\n";
    }

    double totalCalories() const {
        double t = 0;
        for (const auto &w : workouts) t += w.getCalories();
        return t;
    }

    int totalMinutes() const {
        int t = 0;
        for (const auto &w : workouts) t += w.getDuration();
        return t;
    }

    size_t workoutCount() const { return workouts.size(); }
    const vector<Workout> &getWorkouts() const { return workouts; }

    void showProgress() const {
        cout << "\n  ---- Fitness Progress ----\n";
        cout << "  Height : " << heightCm << " cm\n";
        cout << "  Weight : " << fixed << setprecision(1) << getCurrentWeight() << " kg";
        if (weightHistory.size() > 1) {
            double diff = getCurrentWeight() - weightHistory.front();
            cout << "  (change since joining: " << showpos << diff << noshowpos << " kg)";
        }
        cout << "\n  BMI    : " << setprecision(1) << calculateBMI()
             << " (" << bmiCategory(calculateBMI()) << ")\n";
        cout << "  Total workouts : " << workouts.size() << "\n";
        cout << "  Total time     : " << totalMinutes() << " minutes\n";
        cout << "  Calories burned: " << totalCalories() << " kcal\n";

        if (!workouts.empty()) {
            cout << "\n  " << left << setw(12) << "Date" << setw(16) << "Exercise"
                 << setw(12) << "Minutes" << "Calories\n";
            cout << "  " << string(52, '-') << "\n";
            for (const auto &w : workouts) {
                cout << "  ";
                w.display();
            }
        }
    }
};

// ---------------------------------------------------------
//  3. Abstract Class: Person (Polymorphic Base)
// ---------------------------------------------------------
class Person {
protected:
    int id;
    string name;
    int age;
    string phone;

public:
    Person(int id, const string &name, int age, const string &phone)
        : id(id), name(name), age(age), phone(phone) {}
    virtual ~Person() {}

    int getId() const { return id; }
    string getName() const { return name; }
    int getAge() const { return age; }
    string getPhone() const { return phone; }

    void setName(const string &n) { name = n; }
    void setPhone(const string &p) { phone = p; }

    virtual void displayInfo() const = 0;   // pure virtual function
};

// ---------------------------------------------------------
//  4. Derived Class: Trainer (Inherits Person)
// ---------------------------------------------------------
class Trainer : public Person {
private:
    string specialization;
    double hourlyRate;

public:
    Trainer(int id, const string &name, int age, const string &phone,
            const string &spec, double rate)
        : Person(id, name, age, phone), specialization(spec), hourlyRate(rate) {}

    double getHourlyRate() const { return hourlyRate; }

    void displayInfo() const override {
        cout << "  [Trainer #" << id << "] " << left << setw(18) << name
             << " Age: " << setw(4) << age
             << " Speciality: " << setw(16) << specialization
             << " Rate: Rs." << fixed << setprecision(0) << hourlyRate << "/hr\n";
    }
};

// ---------------------------------------------------------
//  5. Derived Class: Member (Inherits Person, Composes Tracker)
// ---------------------------------------------------------
class Member : public Person {
private:
    unique_ptr<MembershipPlan> plan;
    FitnessTracker tracker;
    time_t joinDate;
    time_t expiryDate;
    double totalFeesPaid;
    int trainerId;  // 0 = no trainer assigned

    static const int SECONDS_PER_MONTH = 30 * 24 * 60 * 60;

public:
    Member(int id, const string &name, int age, const string &phone,
           double height, double weight, int planChoice, int months)
        : Person(id, name, age, phone),
          plan(createPlan(planChoice)),
          tracker(height, weight),
          joinDate(time(nullptr)),
          expiryDate(time(nullptr) + (time_t)months * SECONDS_PER_MONTH),
          totalFeesPaid(plan->getMonthlyFee() * months),
          trainerId(0) {}

    FitnessTracker &getTracker() { return tracker; }
    const FitnessTracker &getTracker() const { return tracker; }
    const MembershipPlan &getPlan() const { return *plan; }
    int getTrainerId() const { return trainerId; }
    void setTrainerId(int t) { trainerId = t; }
    double getTotalFeesPaid() const { return totalFeesPaid; }

    bool isActive() const { return time(nullptr) <= expiryDate; }

    int daysLeft() const {
        double secs = difftime(expiryDate, time(nullptr));
        return secs > 0 ? (int)(secs / 86400) : 0;
    }

    void renew(int planChoice, int months) {
        plan = createPlan(planChoice);
        time_t base = isActive() ? expiryDate : time(nullptr);
        expiryDate = base + (time_t)months * SECONDS_PER_MONTH;
        totalFeesPaid += plan->getMonthlyFee() * months;
    }

    void displayInfo() const override {
        cout << "  [Member #" << id << "] " << left << setw(18) << name
             << " Age: " << setw(4) << age
             << " Plan: " << setw(10) << plan->getName()
             << " Expires: " << formatDate(expiryDate)
             << (isActive() ? "  (Active, " + to_string(daysLeft()) + " days left)"
                            : "  (EXPIRED)")
             << "\n";
    }

    void displayFullProfile() const {
        cout << "\n  ======== MEMBER PROFILE ========\n";
        cout << "  ID          : " << id << "\n";
        cout << "  Name        : " << name << "\n";
        cout << "  Age         : " << age << "\n";
        cout << "  Phone       : " << phone << "\n";
        cout << "  Plan        : " << plan->getName() << " (Rs." << fixed << setprecision(0)
             << plan->getMonthlyFee() << "/month)\n";
        cout << "  Benefits    : " << plan->getBenefits() << "\n";
        cout << "  Joined      : " << formatDate(joinDate) << "\n";
        cout << "  Expires     : " << formatDate(expiryDate) << "\n";
        cout << "  Status      : " << (isActive() ? "Active" : "EXPIRED") << "\n";
        cout << "  Fees paid   : Rs." << totalFeesPaid << "\n";
        cout << "  Trainer ID  : " << (trainerId == 0 ? string("Not assigned") : to_string(trainerId)) << "\n";
    }
};

// ---------------------------------------------------------
//  6. Controller / System: Gym Class
// ---------------------------------------------------------
class Gym {
private:
    string gymName;
    vector<unique_ptr<Member>> members;
    vector<unique_ptr<Trainer>> trainers;
    int nextMemberId;
    int nextTrainerId;

    Member *findMember(int id) {
        for (auto &m : members)
            if (m->getId() == id) return m.get();
        return nullptr;
    }

    Trainer *findTrainer(int id) {
        for (auto &t : trainers)
            if (t->getId() == id) return t.get();
        return nullptr;
    }

    static void showPlans() {
        cout << "\n  Available plans:\n";
        for (int i = 1; i <= 3; i++) {
            auto p = createPlan(i);
            cout << "   " << i << ". " << left << setw(9) << p->getName()
                 << "Rs." << setw(6) << fixed << setprecision(0) << p->getMonthlyFee()
                 << "/month  - " << p->getBenefits()
                 << "  (PT discount: " << p->getPersonalTrainingDiscount() << "%)\n";
        }
    }

    Member *askForMember() {
        int id = readInt("  Enter Member ID: ", 1, 1000000);
        Member *m = findMember(id);
        if (!m) cout << "  Member not found.\n";
        return m;
    }

public:
    Gym(const string &name) : gymName(name), nextMemberId(1001), nextTrainerId(1) {}

    void addMember() {
        cout << "\n  --- Register New Member ---\n";
        string name = readLine("  Name: ");
        if (name.empty()) { cout << "  Name cannot be empty.\n"; return; }
        int age = readInt("  Age (12-80): ", 12, 80);
        string phone = readLine("  Phone: ");
        double height = readDouble("  Height in cm (100-250): ", 100, 250);
        double weight = readDouble("  Weight in kg (30-250): ", 30, 250);
        showPlans();
        int plan = readInt("  Choose plan (1-3): ", 1, 3);
        int months = readInt("  Duration in months (1-24): ", 1, 24);

        members.push_back(unique_ptr<Member>(
            new Member(nextMemberId, name, age, phone, height, weight, plan, months)));
        cout << "\n  Member registered successfully! Member ID = " << nextMemberId << "\n";
        nextMemberId++;
    }

    void viewMembers() const {
        cout << "\n  --- All Members (" << members.size() << ") ---\n";
        if (members.empty()) { cout << "  No members yet.\n"; return; }
        for (const auto &m : members) m->displayInfo();   // polymorphic call
    }

    void viewMemberProfile() {
        Member *m = askForMember();
        if (m) m->displayFullProfile();
    }

    void searchByName() const {
        string key = readLine("  Enter name (or part of name): ");
        transform(key.begin(), key.end(), key.begin(), ::tolower);
        bool found = false;
        for (const auto &m : members) {
            string n = m->getName();
            transform(n.begin(), n.end(), n.begin(), ::tolower);
            if (n.find(key) != string::npos) { m->displayInfo(); found = true; }
        }
        if (!found) cout << "  No matching members.\n";
    }

    void renewMembership() {
        Member *m = askForMember();
        if (!m) return;
        showPlans();
        int plan = readInt("  Choose plan (1-3): ", 1, 3);
        int months = readInt("  Months to renew (1-24): ", 1, 24);
        m->renew(plan, months);
        cout << "  Membership renewed. New status:\n";
        m->displayInfo();
    }

    void removeMember() {
        int id = readInt("  Enter Member ID to remove: ", 1, 1000000);
        auto it = remove_if(members.begin(), members.end(),
                            [id](const unique_ptr<Member> &m) { return m->getId() == id; });
        if (it == members.end()) { cout << "  Member not found.\n"; return; }
        members.erase(it, members.end());
        cout << "  Member removed.\n";
    }

    void viewExpiredMembers() const {
        cout << "\n  --- Expired Memberships ---\n";
        bool any = false;
        for (const auto &m : members)
            if (!m->isActive()) { m->displayInfo(); any = true; }
        if (!any) cout << "  No expired memberships.\n";
    }

    // ---- Trainers ----
    void addTrainer() {
        cout << "\n  --- Add Trainer ---\n";
        string name = readLine("  Name: ");
        if (name.empty()) { cout << "  Name cannot be empty.\n"; return; }
        int age = readInt("  Age (18-65): ", 18, 65);
        string phone = readLine("  Phone: ");
        string spec = readLine("  Specialization (e.g. Cardio, Yoga): ");
        double rate = readDouble("  Hourly rate (Rs.): ", 100, 10000);
        trainers.push_back(unique_ptr<Trainer>(
            new Trainer(nextTrainerId, name, age, phone, spec, rate)));
        cout << "  Trainer added with ID = " << nextTrainerId++ << "\n";
    }

    void viewTrainers() const {
        cout << "\n  --- Trainers (" << trainers.size() << ") ---\n";
        if (trainers.empty()) { cout << "  No trainers yet.\n"; return; }
        for (const auto &t : trainers) t->displayInfo();
    }

    void assignTrainer() {
        Member *m = askForMember();
        if (!m) return;
        if (trainers.empty()) { cout << "  Add a trainer first.\n"; return; }
        viewTrainers();
        int tid = readInt("  Enter Trainer ID: ", 1, 1000000);
        Trainer *t = findTrainer(tid);
        if (!t) { cout << "  Trainer not found.\n"; return; }
        m->setTrainerId(tid);

        double disc = m->getPlan().getPersonalTrainingDiscount();
        double rate = t->getHourlyRate() * (1.0 - disc / 100.0);
        cout << "  Trainer " << t->getName() << " assigned to " << m->getName() << ".\n";
        cout << "  Your PT rate after " << disc << "% " << m->getPlan().getName()
             << " discount: Rs." << fixed << setprecision(0) << rate << "/hr\n";
    }

    // ---- Fitness Tracking ----
    void logWorkout() {
        Member *m = askForMember();
        if (!m) return;
        if (!m->isActive()) { cout << "  Membership expired. Please renew first.\n"; return; }
        cout << "\n  1.Running  2.Cycling  3.Walking  4.Swimming  5.Weightlifting  6.Yoga\n";
        int ex = readInt("  Choose exercise (1-6): ", 1, 6);
        int mins = readInt("  Duration in minutes (1-300): ", 1, 300);
        m->getTracker().logWorkout(ex, mins);
    }

    void updateWeight() {
        Member *m = askForMember();
        if (!m) return;
        double w = readDouble("  New weight in kg (30-250): ", 30, 250);
        m->getTracker().updateWeight(w);
        cout << "  Weight updated. New BMI: " << fixed << setprecision(1)
             << m->getTracker().calculateBMI() << " ("
             << FitnessTracker::bmiCategory(m->getTracker().calculateBMI()) << ")\n";
    }

    void viewProgress() {
        Member *m = askForMember();
        if (m) m->getTracker().showProgress();
    }

    void showLeaderboard() const {
        cout << "\n  --- Calories Leaderboard ---\n";
        if (members.empty()) { cout << "  No members yet.\n"; return; }
        vector<const Member *> sorted;
        for (const auto &m : members) sorted.push_back(m.get());
        sort(sorted.begin(), sorted.end(), [](const Member *a, const Member *b) {
            return a->getTracker().totalCalories() > b->getTracker().totalCalories();
        });
        int rank = 1;
        for (const Member *m : sorted) {
            cout << "  " << rank++ << ". " << left << setw(18) << m->getName()
                 << fixed << setprecision(1) << m->getTracker().totalCalories() << " kcal ("
                 << m->getTracker().workoutCount() << " workouts)\n";
            if (rank > 5) break;
        }
    }

    // ---- Reports ----
    void revenueReport() const {
        double total = 0;
        for (const auto &m : members) total += m->getTotalFeesPaid();
        int active = 0;
        for (const auto &m : members) if (m->isActive()) active++;
        cout << "\n  --- Gym Summary: " << gymName << " ---\n";
        cout << "  Total members   : " << members.size() << "\n";
        cout << "  Active members  : " << active << "\n";
        cout << "  Expired members : " << members.size() - active << "\n";
        cout << "  Total trainers  : " << trainers.size() << "\n";
        cout << "  Total revenue   : Rs." << fixed << setprecision(0) << total << "\n";
    }

    void saveReportToFile() const {
        ofstream out("gym_report.txt");
        if (!out) { cout << "  Could not create file.\n"; return; }
        out << "GYM REPORT - " << gymName << "  (" << formatDate(time(nullptr)) << ")\n";
        out << string(70, '=') << "\n";
        double total = 0;
        for (const auto &m : members) {
            out << "ID " << m->getId() << " | " << m->getName()
                << " | Plan: " << m->getPlan().getName()
                << " | " << (m->isActive() ? "Active" : "Expired")
                << " | Workouts: " << m->getTracker().workoutCount()
                << " | Calories: " << fixed << setprecision(1) << m->getTracker().totalCalories()
                << " | BMI: " << m->getTracker().calculateBMI() << "\n";
            total += m->getTotalFeesPaid();
        }
        out << string(70, '=') << "\n";
        out << "Total members: " << members.size() << "\n";
        out << "Total revenue: Rs." << fixed << setprecision(0) << total << "\n";
        out.close();
        cout << "  Report saved to gym_report.txt\n";
    }

    // Pre-populate demo data so the system isn't empty on launch
    void seedDemoData() {
        // Add sample trainers
        trainers.push_back(unique_ptr<Trainer>(new Trainer(nextTrainerId++, "Vikram Singh", 28, "9876543210", "Strength & Conditioning", 500)));
        trainers.push_back(unique_ptr<Trainer>(new Trainer(nextTrainerId++, "Anjali Mehta", 26, "9876543211", "Yoga & Mobility", 450)));
        trainers.push_back(unique_ptr<Trainer>(new Trainer(nextTrainerId++, "Rahul Verma", 32, "9876543212", "Cardio & HIIT", 400)));

        // Add sample members
        members.push_back(unique_ptr<Member>(new Member(nextMemberId++, "Aarav Patel", 22, "9123456780", 175.0, 72.0, 3, 6))); // Platinum
        members.back()->setTrainerId(1);
        members.back()->getTracker().logWorkout(1, 45); // Running
        members.back()->getTracker().logWorkout(5, 60); // Weightlifting

        members.push_back(unique_ptr<Member>(new Member(nextMemberId++, "Sneha Kulkarni", 24, "9123456781", 162.0, 58.0, 2, 3))); // Premium
        members.back()->setTrainerId(2);
        members.back()->getTracker().logWorkout(6, 40); // Yoga
        members.back()->getTracker().logWorkout(2, 30); // Cycling

        members.push_back(unique_ptr<Member>(new Member(nextMemberId++, "Rohan Deshmukh", 29, "9123456782", 180.0, 85.0, 1, 1))); // Basic
        members.back()->getTracker().logWorkout(3, 45); // Walking
    }
};

// ---------------------------------------------------------
//  Menu Interface
// ---------------------------------------------------------
void showMenu() {
    cout << "\n=============================================\n";
    cout << "     GYM MEMBERSHIP & FITNESS TRACKER\n";
    cout << "=============================================\n";
    cout << "  -- Membership Management --\n";
    cout << "   1. Register new member\n";
    cout << "   2. View all members\n";
    cout << "   3. View member full profile\n";
    cout << "   4. Search member by name\n";
    cout << "   5. Renew membership\n";
    cout << "   6. Remove member\n";
    cout << "   7. View expired memberships\n";
    cout << "  -- Trainer Management --\n";
    cout << "   8. Add trainer\n";
    cout << "   9. View all trainers\n";
    cout << "  10. Assign trainer to member (with plan discount)\n";
    cout << "  -- Fitness Tracking --\n";
    cout << "  11. Log workout (calculates MET calories burned)\n";
    cout << "  12. Update weight & recalculate BMI\n";
    cout << "  13. View member progress & workout history\n";
    cout << "  14. Calories leaderboard (Top members)\n";
    cout << "  -- Reports & Analytics --\n";
    cout << "  15. Gym summary & revenue report\n";
    cout << "  16. Save report to file (gym_report.txt)\n";
    cout << "   0. Exit\n";
}

int main() {
    Gym gym("FitZone Fitness Club");
    gym.seedDemoData(); // Pre-populate realistic data for demonstration
    int choice;

    cout << "\n[System] FitZone Gym Management System initialized with sample members and trainers.\n";

    do {
        showMenu();
        choice = readInt("\n  Enter your choice (0-16): ", 0, 16);
        switch (choice) {
            case 1:  gym.addMember();           break;
            case 2:  gym.viewMembers();         break;
            case 3:  gym.viewMemberProfile();   break;
            case 4:  gym.searchByName();        break;
            case 5:  gym.renewMembership();     break;
            case 6:  gym.removeMember();        break;
            case 7:  gym.viewExpiredMembers();  break;
            case 8:  gym.addTrainer();          break;
            case 9:  gym.viewTrainers();        break;
            case 10: gym.assignTrainer();       break;
            case 11: gym.logWorkout();          break;
            case 12: gym.updateWeight();        break;
            case 13: gym.viewProgress();        break;
            case 14: gym.showLeaderboard();     break;
            case 15: gym.revenueReport();       break;
            case 16: gym.saveReportToFile();    break;
            case 0:  cout << "\n  Thank you for using the Gym Management System. Stay fit!\n"; break;
        }
    } while (choice != 0);

    return 0;
}
