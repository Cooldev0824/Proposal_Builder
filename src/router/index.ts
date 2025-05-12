import { RouteRecordRaw } from "vue-router";
import EditorView from "../views/EditorView.vue";
import DashboardView from "../views/DashboardView.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Dashboard",
    component: DashboardView,
  },
  {
    path: "/editor/:id?",
    name: "Editor",
    component: EditorView,
    props: true,
  },
];

export default routes;