// TODO: LocalStorage 또는 Cookie를 사용하여 방문 횟수 관리 테스트 및 구현 필요
// LocalStorage 또는 Cookie를 사용하여 방문 횟수 관리
class VisitTracker {
  static async getVisitCount(): Promise<number> {
    return parseInt(localStorage.getItem("visitCount") || "0");
  }

  static async incrementVisit(): Promise<void> {
    const count = await this.getVisitCount();
    localStorage.setItem("visitCount", (count + 1).toString());
  }

  static async resetVisitCount(): Promise<void> {
    localStorage.removeItem("visitCount");
  }
}

export default VisitTracker;
