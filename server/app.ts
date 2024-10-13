import AuthenticatingConcept from "./concepts/authenticating";
import CommentingConcept from "./concepts/commenting";
import CompetingConcept from "./concepts/competing";
import FriendingConcept from "./concepts/friending";
import JoiningConcept from "./concepts/joining";
import LinkingConcept from "./concepts/linking";
import PostingConcept from "./concepts/posting";
import SessioningConcept from "./concepts/sessioning";
import TrackingConcept from "./concepts/tracking";

// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
export const Authing = new AuthenticatingConcept("users");
export const Sessioning = new SessioningConcept();
export const Friending = new FriendingConcept("friends");
export const Posting = new PostingConcept("posts");
export const Commenting = new CommentingConcept("comments");
export const Tracking = new TrackingConcept("data");
export const Competing = new CompetingConcept("competitions");
export const Joining = new JoiningConcept("groups");
export const Linking = new LinkingConcept("links");
